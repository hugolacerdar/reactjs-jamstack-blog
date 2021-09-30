/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Component, ReactElement, createRef, RefObject } from 'react';

import styles from './comments.module.scss';

export default class Comments extends Component {
  commentBox: RefObject<HTMLDivElement>;

  constructor(props) {
    super(props);
    this.commentBox = createRef();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  componentDidMount(): void {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'hugolacerdar/reactjs-jamstack-blog');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'dark-blue');
    this.commentBox.current.appendChild(script);
  }

  render(): ReactElement {
    return <div ref={this.commentBox} className={styles.mainDiv} />;
  }
}
