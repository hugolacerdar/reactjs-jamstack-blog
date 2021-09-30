import Link from 'next/link';
import { ReactElement } from 'react';

import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <header className={styles.postHeader}>
      <Link href="/">
        <a>
          <img src="/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
