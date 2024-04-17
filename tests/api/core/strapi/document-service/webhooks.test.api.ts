import type { Core } from '@strapi/types';

import { createTestSetup, destroyTestSetup } from '../../../utils/builder-helper';
import { testInTransaction } from '../../../utils/index';
import resources from './resources/index';
import { ARTICLE_UID, findArticlesDb, AUTHOR_UID } from './utils';
describe('Document Service', () => {
  let testUtils;
  let strapi: Core.Strapi;

  beforeAll(async () => {
    // Mock the module
    jest.doMock('../../../../../packages/core/core/src/services/document-service/webhooks', () => ({
      ...jest.requireActual<Record<string, unknown>>(
        '../../../../../packages/core/core/src/services/document-service/webhooks'
      ),
      emitWebhook: jest.fn(() => {
        console.log('hello');
        return Promise.resolve();
      }),
    }));

    testUtils = await createTestSetup(resources);
    strapi = testUtils.strapi;
  });

  afterAll(async () => {
    await destroyTestSetup(testUtils);
  });

  describe('Creates', () => {
    it(
      'can create a document',
      testInTransaction(async () => {
        const article = await strapi.documents(ARTICLE_UID).create({
          data: { title: 'Article' },
        });

        // verify that the returned document was updated
        expect(article).toMatchObject({
          title: 'Article',
          locale: 'en', // default locale
          publishedAt: null, // should be a draft
        });

        const articles = await findArticlesDb({ documentId: article.documentId });
        // Only one article should have been created
        expect(articles).toHaveLength(1);
      })
    );
  });
});
