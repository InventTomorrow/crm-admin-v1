import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { LuChevronRight } from 'react-icons/lu';
import { usePermissions } from '@/features/auth/auth.hooks';
import { useAdminSidebarCounts } from '@/lib/useAdminSidebarCounts';
import { menuItemsData, type MenuItemType } from './menu';

/** Matches nested routes too, so /tenants/:id and /plans/new highlight their item. */
const isPathActive = (href: string | undefined, pathname: string): boolean => {
  if (!href) return false;
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
};

const isItemActive = (item: MenuItemType, pathname: string): boolean => {
  if (isPathActive(item.href, pathname)) return true;
  if (item.children) {
    return item.children.some(child => isItemActive(child, pathname));
  }
  return false;
};

type PermissionCheck = (permission: NonNullable<MenuItemType['permission']>) => boolean;

/** Keeps a link only when the role holds its permission; children are filtered too. */
const filterByPermission = (items: MenuItemType[], can: PermissionCheck): MenuItemType[] =>
  items.reduce<MenuItemType[]>((visible, item) => {
    if (item.permission && !can(item.permission)) return visible;

    if (item.children) {
      const children = filterByPermission(item.children, can);
      // A group with nothing left under it would open onto an empty submenu.
      if (!children.length) return visible;
      return [...visible, { ...item, children }];
    }

    return [...visible, item];
  }, []);

/**
 * Drops a section title once every link beneath it has been filtered out. The
 * menu is flat, so a title owns the items up to the next title — if the very
 * next entry is another title (or the list ends), this section is empty.
 */
const dropEmptySections = (items: MenuItemType[]): MenuItemType[] =>
  items.filter((item, index) => {
    if (!item.isTitle) return true;
    const nextItem = items[index + 1];
    return !!nextItem && !nextItem.isTitle;
  });

const MenuItemWithChildren = ({ item }: { item: MenuItemType }) => {
  const { pathname } = useLocation();
  const Icon = item.icon;

  const isActive = isItemActive(item, pathname);

  return (
    <li className={`menu-item hs-accordion ${isActive ? 'active' : ''}`}>
      <button className={`hs-accordion-toggle menu-link ${isActive ? 'active' : ''}`}>
        {Icon && (
          <span className="menu-icon">
            <Icon />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        <span className="menu-arrow">
          <LuChevronRight />
        </span>
      </button>

      <ul
        className={`sub-menu hs-accordion-content hs-accordion-group ${
          isActive ? 'block' : 'hidden'
        }`}
      >
        {item.children?.map((child: MenuItemType) =>
          child.children ? (
            <MenuItemWithChildren key={child.key} item={child} />
          ) : (
            <MenuItem key={child.key} item={child} />
          )
        )}
      </ul>
    </li>
  );
};

const MenuItem = ({ item, badge }: { item: MenuItemType; badge?: number }) => {
  const { pathname } = useLocation();
  const Icon = item.icon;
  const isActive = isPathActive(item.href, pathname);

  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link to={item.href ?? '#'} className={`menu-link ${isActive ? 'active' : ''}`}>
        {Icon && (
          <span className="menu-icon">
            <Icon />
          </span>
        )}
        <div className="menu-text">{item.label}</div>
        {!!badge && (
          <span className="ms-auto rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-white">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
};

const AppMenu = () => {
  const counts = useAdminSidebarCounts();
  const { can } = usePermissions();

  const visibleItems = useMemo(
    () => dropEmptySections(filterByPermission(menuItemsData, can)),
    [can]
  );

  return (
    <ul className="side-nav p-3 hs-accordion-group">
      {visibleItems.map((item: MenuItemType) =>
        item.isTitle ? (
          <li className="menu-title" key={item.key}>
            <span>{item.label}</span>
          </li>
        ) : item.children ? (
          <MenuItemWithChildren key={item.key} item={item} />
        ) : (
          <MenuItem key={item.key} item={item} badge={counts[item.key]} />
        )
      )}
    </ul>
  );
};

export default AppMenu;
