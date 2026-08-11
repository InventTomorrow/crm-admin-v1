import { DEFAULT_PAGE_TITLE } from '@/helpers/constants';

type PageMetaProps = {
  title?: string;
};

const PageMeta = ({ title }: PageMetaProps) => {
  return <title>{title ? `${title} | ${DEFAULT_PAGE_TITLE}` : DEFAULT_PAGE_TITLE}</title>;
};

export default PageMeta;
