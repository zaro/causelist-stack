import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { CaseIndex } from '../interfaces/search-index.js';

@Injectable()
export class MeiliService {
  log = new Logger(MeiliService.name);
  client: MeiliSearch;
  _casesIndex: Index<CaseIndex>;
  _taskIds: number[] = [];
  _freeDocsCutoffDate = new Date('2010-01-01T00:00:00.000Z');

  constructor(configService: ConfigService) {
    const apiKey = configService.getOrThrow('MEILI_API_KEY');
    const host = configService.get('MEILI_HOST', 'http://meilisearch:7700');
    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  async casesIndex() {
    if (!this._casesIndex) {
      this._casesIndex = await this.client.index('cases');
    }
    return this._casesIndex;
  }

  async createIndexes(dropExisting: boolean) {
    if (dropExisting) {
      const _casesIndex = await this.client.index('cases');
      if (_casesIndex) {
        this.log.log('Dropping "cases" index...');
        const task = await _casesIndex.delete();
        await this.client.waitForTask(task.taskUid);
        this.log.log('Index deleted!');
      }
    }

    this.log.log('Creating "cases" index');
    let task = await this.client.createIndex('cases', {
      primaryKey: 'case_id',
    });
    await this.client.waitForTask(task.taskUid);
    const index = await this.casesIndex();
    const filterable = ['case_id', 'date_delivered_ms'];
    this.log.log(`Updating filterable attributes to ${filterable}`);
    task = await index.updateFilterableAttributes(filterable);
    await this.client.waitForTask(task.taskUid);
    const sortable = ['date_delivered'];
    this.log.log(`Updating sortable attributes to ${sortable}`);
    task = await index.updateSortableAttributes(sortable);
    await this.client.waitForTask(task.taskUid);
    this.log.log(`Updating ranking rules`);
    const currentRankingRules = await index.getRankingRules();
    const newRules = [
      'sort',
      ...currentRankingRules.filter((r) => r !== 'sort'),
    ];
    task = await index.updateRankingRules(newRules);
    await this.client.waitForTask(task.taskUid);
    this.log.log(`Done creating index cases`);
  }

  async filterOutExisting(cases: CaseIndex[]) {
    const index = await this.casesIndex();
    const r = await index.getDocuments({
      fields: ['case_id'],
      filter: `case_id IN [${cases.map((c) => c.case_id).join(',')}]`,
      limit: cases.length,
    });
    return cases.filter((c) => !r.results.some((e) => e.case_id === c.case_id));
  }

  async insertCases(cases: CaseIndex[]) {
    const index = await this.casesIndex();
    const etask = await index.addDocuments(cases);
    this._taskIds.push(etask.taskUid);
    // const task = await this.client.waitForTask(etask.taskUid, {
    //   timeOutMs: 10000,
    // });
    // if (task.error) {
    //   this.log.error(task.error);
    // }
  }

  async getById(caseId: string, highlightQs?: string) {
    const index = await this.casesIndex();
    const r = await index.getDocuments({
      filter: `case_id = ${caseId}`,
    });
    return r.results[0];
  }

  async getByIdWithHighlight(caseId: string, highlightQs: string) {
    const index = await this.casesIndex();
    const filter = `case_id = ${caseId}`;

    const r = await index.search(highlightQs, {
      filter,
      attributesToSearchOn: ['html'],
      attributesToHighlight: ['html'],
      highlightPreTag: '<b>',
      highlightPostTag: '</b>',
    });
    return r.hits[0];
  }

  //   As for the cases it would be structured that those from High Courts (excluding Crts of Appeal) dating btwn 1963-2010 will be free and accessible without need to sign in/up.
  //These make up approx 20%. Until 2010 there were H/Crts, Lbr Crts(since 2007), Commercial Crts & Crts of Appeal.
  // There would be this prompt on the platform:
  // to get more relevant cases select the PRO MODE/VERSION FOR FREE to view cases decided after 2010 and those from the Supreme Court and Courts of Appeal.
  async searchCases(
    queryString: string,
    options?: {
      page?: number;
      sortByDate?: 'asc' | 'desc';
      offset?: number;
      limit?: number;
      paidResults: boolean;
    },
  ) {
    const index = await this.casesIndex();
    const sort = options?.sortByDate
      ? [`date_delivered:${options?.sortByDate}`]
      : undefined;
    const filter = options?.paidResults
      ? undefined
      : [`date_delivered_ms < ${this._freeDocsCutoffDate.getTime()}`];
    const r = await index.search(queryString, {
      attributesToSearchOn: ['txt'],
      attributesToHighlight: ['txt'],
      attributesToCrop: ['txt'],
      attributesToRetrieve: ['case_id', 'judge', 'parties', 'date_delivered'],
      cropLength: 60,
      highlightPreTag: '<b>',
      highlightPostTag: '</b>',
      sort,
      showRankingScore: true,
      showRankingScoreDetails: true,
      page: options?.page,
      offset: options?.offset,
      limit: options?.limit,
      filter,
      // hitsPerPage: 1,
    });
    return r;
  }

  async waitAllTasks() {
    const r = this.client.waitForTasks(this._taskIds, {
      timeOutMs: 1000 * 60 * 60,
      intervalMs: 1000 * 10,
    });
    this._taskIds = [];
    return r;
  }
}
