/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import Prismic from '@prismicio/client';

import { Document } from '@prismicio/client/types/documents';

const apiEndPoint = process.env.PRISMIC_API_ENDPOINT;
const apiAccessToken = process.env.PRISMIC_ACCESS_TOKEN;

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

const createClientOptions = (req = null, prismicAccessToken = null) => {
  const reqOptions = req ? { req } : {};

  const accessTokenOptions = prismicAccessToken
    ? { accessToken: prismicAccessToken }
    : {};

  return {
    ...reqOptions,
    ...accessTokenOptions,
  };
};

const Client = (req = null) => {
  return Prismic.client(apiEndPoint, createClientOptions(req, apiAccessToken));
};

export default async (req, res) => {
  const { token: ref, documentId } = req.query;
  const redirectUrl = await Client(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });

  res.writeHead(302, { Location: `${redirectUrl}` });

  res.end();
};