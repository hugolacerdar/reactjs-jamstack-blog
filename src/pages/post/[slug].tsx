/* eslint-disable react/no-danger */
/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { ParsedUrlQuery } from 'querystring';
import { ReactElement } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    subtitle?: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const { isFallback } = useRouter();

  if (isFallback) return <strong>Carregando...</strong>;

  const wordsCount = post.data.content.reduce((total, section) => {
    total += section.heading.split(' ').length;

    const bodyWordsCount = section.body.map(
      item => item.text.split(' ').length
    );

    // eslint-disable-next-line no-return-assign
    bodyWordsCount.forEach(count => (total += count));

    return total;
  }, 0);

  const expectedReadTime = Math.ceil(wordsCount / 200);

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <div className={styles.postHeader}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar /> {formattedDate}
              </li>
              <li>
                <FiUser /> {post.data.author}
              </li>
              <li>
                <FiClock /> {expectedReadTime} min
              </li>
            </ul>
          </div>
          {post.data.content.map(section => {
            return (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <div
                  className={styles.postSectionBody}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(section.body),
                  }}
                />
              </section>
            );
          })}
        </article>
      </main>
    </>
  );
}

interface GSPathsReturn {
  paths: { params: { slug: string } }[];
  fallback: true | false | 'blocking';
}

export const getStaticPaths: GetStaticPaths =
  async (): Promise<GSPathsReturn> => {
    const prismic = getPrismicClient();
    const posts = await prismic.query([
      Prismic.predicates.at('document.type', 'posts'),
    ]);

    const paths = posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    });

    return {
      paths,
      fallback: true,
    };
  };

interface GSPropsReturn {
  props: PostProps;
  revalidate: number;
}

interface IParams extends ParsedUrlQuery {
  slug: string;
}

export const getStaticProps: GetStaticProps = async (
  context
): Promise<GSPropsReturn> => {
  const prismic = getPrismicClient();
  const { slug } = context.params as IParams;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(section => {
        return {
          heading: section.heading,
          body: [...section.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 3 * 10,
  };
};
