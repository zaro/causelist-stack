import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Configuration,
  IndexApi,
  SearchApi,
  UtilsApi,
  ResponseError,
  SearchRequest,
} from 'manticoresearch-ts';
import { buffer } from 'node:stream/consumers';
import { CaseIndex } from '../interfaces/search-index.js';

const CREATE_CASE_INDEX = `CREATE TABLE cases(
    title text,
    url text,
    case_id text,
    case_number text,
    parties text,
    date_delivered_human text,
    date_delivered timestamp,
    case_class text,
    court text,
    case_action text,
    judge text,
    citation text,
    disclaimer text,
    meta json,
    html text,
    txt text
  )`;

@Injectable()
export class ManticoreService {
  protected log = new Logger(ManticoreService.name);

  indexApi: IndexApi;
  searchApi: SearchApi;
  utilsApi: UtilsApi;

  constructor(configService: ConfigService) {
    const config = new Configuration({
      basePath: configService.get(
        'MANTICORE_BASE_PATH',
        'http://manticore:9308',
      ),
    });
    this.indexApi = new IndexApi(config);
    this.searchApi = new SearchApi(config);
    this.utilsApi = new UtilsApi(config);
  }

  async createIndexes() {
    try {
      const sr: any[] = await this.utilsApi.sql('SHOW TABLES', true);
      if (sr[0].data.some((r) => r.Index == 'cases')) {
        return;
      }
      const cr = await this.utilsApi.sql(CREATE_CASE_INDEX, true);
    } catch (e: any) {
      this.log.error('Manticore error:', e);
      const buf = await buffer(e.response.body); // <-- Use your stream here!
      this.log.error(buf.toString());
      throw e;
    }
  }

  parseCaseId(caseId: string) {
    const id = parseInt(caseId, 10);
    if (!(id > 0 && id <= Number.MAX_SAFE_INTEGER)) {
      throw new Error(`Invalid case ID: c.caseId`);
    }
    return id;
  }

  async insertCases(cases: CaseIndex[]) {
    const ops = cases.map((c) => {
      const id = this.parseCaseId(c.case_id);
      return {
        insert: {
          index: 'cases',
          id,
          doc: c,
        },
      };
    });
    try {
      return await this.indexApi.bulk(
        ops.map((doc) => JSON.stringify(doc)).join('\n'),
      );
    } catch (e: any) {
      this.log.error('Manticore error:', e);
      const buf = await buffer(e.response.body); // <-- Use your stream here!
      this.log.error(buf.toString());
      throw e;
    }
  }

  async getById(caseId: string, highlightQs?: string) {
    const highlight = highlightQs
      ? {
          highlight_query: {
            match: {
              html: highlightQs,
            },
          },
        }
      : {};
    try {
      const id = this.parseCaseId(caseId);
      return await this.searchApi.search({
        index: 'cases',
        query: {
          bool: {
            must: [{ equals: { id: 61373 } }],
          },
        },
        highlight: {
          ...highlight,
          fields: ['html'],
          emit_zones: true,
          pre_tags: '<b class="hl">',
          post_tags: '</b>',
          limit: 16535,
        },
      } as unknown as SearchRequest);
    } catch (e: any) {
      this.log.error('Manticore error:', e);
      const buf = await buffer(e.response.body); // <-- Use your stream here!
      this.log.error(buf.toString());
      throw e;
    }
  }

  async searchCases(queryString: string) {
    try {
      return await this.searchApi.search({
        index: 'cases',
        _source: {
          excludes: ['meta', 'html', 'txt', 'disclaimer'],
        },
        max_matches: 20,
        query: {
          // query_string: queryString,
          match: {
            txt: queryString,
          },
        },
        highlight: {
          emit_zones: true,
          pre_tags: '<b class="hl">',
          post_tags: '</b>',
        },
        html_strip_mode: 'strip',
      } as unknown as SearchRequest);
    } catch (e: any) {
      this.log.error('Manticore error:', e);
      const buf = await buffer(e.response.body); // <-- Use your stream here!
      this.log.error(buf.toString());
      throw e;
    }
  }
}
