import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IaaInputData, IaaMetricsResponse } from "../types";
import type { IaaParams, MetricsSource } from "./source";
import { useMetricsPage } from "./useMetricsPage";

vi.mock("./saveBlob", () => ({ saveBlob: vi.fn() }));

function task(): IaaInputData {
  const ass = (annotator: string, label: string) => ({
    annotator,
    difficulty_rating: 2,
    annotations: [{ start: 0, end: 1, label, text: "x" }],
  });
  return {
    labelset: { labels: [{ name: "A" }, { name: "B" }] },
    documents: [
      { id: "1", name: "d1", full_text: "one", assignments: [ass("alice", "A"), ass("bob", "B")] },
      { id: "2", name: "d2", full_text: "two", assignments: [ass("alice", "B"), ass("bob", "A")] },
      { id: "3", name: "d3", full_text: "three", assignments: [ass("alice", "A"), ass("carol", "A")] },
    ],
  };
}

function fakeSource() {
  const computed: IaaInputData[] = [];
  const downloaded: IaaInputData[] = [];
  const source: MetricsSource = {
    getLabels: () => [],
    getAnnotators: () => [],
    getDocuments: () => [],
    getAnnotations: async () => [],
    getIaaInputData: async () => task(),
    computeMetrics: async (input: IaaInputData, _params: IaaParams) => {
      computed.push(input);
      return {} as IaaMetricsResponse;
    },
    downloadReport: async (input: IaaInputData) => {
      downloaded.push(input);
      return new Blob();
    },
  };
  return { source, computed, downloaded };
}

async function setup() {
  const fake = fakeSource();
  const errors: string[] = [];
  const page = useMetricsPage(fake.source, (message) => errors.push(message));
  await page.init();
  return { ...fake, errors, page };
}

const docNames = (input: IaaInputData) => input.documents.map((d) => d.name);

describe("useMetricsPage filtering", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  it("sends the whole task when no filter is selected", async () => {
    expect(ctx.page.hasFilters.value).toBe(false);
    await ctx.page.computeMetrics();
    expect(ctx.computed).toEqual([task()]);
  });

  it("sends only the filtered subset to computeMetrics", async () => {
    ctx.page.selectedDocuments.value = ["1", "2"];
    ctx.page.selectedLabels.value = ["A"];
    expect(ctx.page.hasFilters.value).toBe(true);
    await ctx.page.computeMetrics();

    const [input] = ctx.computed;
    expect(docNames(input)).toEqual(["d1", "d2"]);
    expect(input.labelset.labels).toEqual([{ name: "A" }]);
    expect(ctx.errors).toEqual([]);
    expect(ctx.page.metricsModalVisible.value).toBe(true);
  });

  it("does not call the service, and reports why, when the subset can't be computed", async () => {
    ctx.page.selectedAnnotators.value = ["carol"];
    await ctx.page.computeMetrics();

    expect(ctx.computed).toEqual([]);
    expect(ctx.errors).toEqual([expect.stringMatching(/two annotators/)]);
    expect(ctx.page.metricsModalVisible.value).toBe(false);
  });

  it("reports a document filter the host's input can't satisfy", async () => {
    const fake = fakeSource();
    fake.source.getIaaInputData = async () => {
      const input = task();
      for (const doc of input.documents) delete doc.id;
      return input;
    };
    const errors: string[] = [];
    const page = useMetricsPage(fake.source, (message) => errors.push(message));
    await page.init();
    page.selectedDocuments.value = ["1"];
    await page.computeMetrics();

    expect(fake.computed).toEqual([]);
    expect(errors).toEqual([expect.stringMatching(/Failed to apply filters.*id/)]);
  });

  it("downloads the filtered subset, anonymized after filtering", async () => {
    ctx.page.selectedAnnotators.value = ["bob", "carol"];
    const done = ctx.page.downloadReport();
    expect(ctx.page.anonymizeConfirmVisible.value).toBe(true);
    ctx.page.resolveAnonymizeConfirm(true);
    await done;

    const [input] = ctx.downloaded;
    expect(docNames(input)).toEqual(["d1", "d2", "d3"]);
    expect(input.documents.map((d) => d.assignments.map((a) => a.annotator))).toEqual([["1"], ["1"], ["2"]]);
    expect(ctx.errors).toEqual([]);
  });

  it("does not ask about anonymizing when the subset can't be downloaded", async () => {
    ctx.page.selectedDocuments.value = ["3"];
    ctx.page.selectedAnnotators.value = ["bob"];
    await ctx.page.downloadReport();

    expect(ctx.page.anonymizeConfirmVisible.value).toBe(false);
    expect(ctx.downloaded).toEqual([]);
    expect(ctx.errors).toEqual(["No documents match the selected filters."]);
  });
});
