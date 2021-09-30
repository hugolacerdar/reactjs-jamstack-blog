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
import Link from 'next/link';

import Comments from '../../components/Comments';
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

interface PostLink {
  uid?: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: Post;
  navigation: {
    previous: PostLink[];
    next: PostLink[];
  };
  preview: boolean;
}

export default function Post({
  post,
  preview,
  navigation,
}: PostProps): ReactElement {
  const { isFallback } = useRouter();

  if (isFallback) return <strong>Carregando...</strong>;

  const wordsCount = post.data.content.reduce((total, section) => {
    total += section.heading.split(' ').length;

    const bodyWordsCount = section.body.map(item => {
      return item.text?.split(' ').length ?? 0;
    });

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

  const isEdited = post.first_publication_date !== post.last_publication_date;

  const editionDate = isEdited
    ? format(
        new Date(post.last_publication_date),
        "'* editado em' dd MMM yyyy', às' H':'m",
        {
          locale: ptBR,
        }
      )
    : undefined;

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
            {isEdited && <span>{editionDate}</span>}
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

        <section className={styles.navigation}>
          {navigation?.previous.length > 0 ? (
            <div>
              <h3>{navigation.previous[0].data.title}</h3>
              <Link href={`/post/${navigation.previous[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          ) : (
            <div />
          )}
          {navigation?.next.length > 0 ? (
            <div>
              <h3>{navigation.next[0].data.title}</h3>
              <Link href={`/post/${navigation.next[0].uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          ) : (
            <div />
          )}
        </section>

        <Comments />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}): Promise<GSPropsReturn> => {
  const prismic = getPrismicClient();
  const { slug } = params as IParams;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const previous = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const next = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date]',
    }
  );

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
      navigation: {
        previous: previous?.results,
        next: next?.results,
      },
      preview,
    },
    revalidate: 60 * 3 * 10,
  };
};
