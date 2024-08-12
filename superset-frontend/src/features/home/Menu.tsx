/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { useState, useEffect } from 'react';
import { styled, css, useTheme, SupersetTheme } from '@superset-ui/core';
import { debounce } from 'lodash';
import { Global } from '@emotion/react';
import { getUrlParam } from 'src/utils/urlUtils';
import { Row, Col, Grid } from 'src/components';
import { MainNav as DropdownMenu, MenuMode } from 'src/components/Menu';
import { Tooltip } from 'src/components/Tooltip';
import { NavLink, useLocation } from 'react-router-dom';
import { GenericLink } from 'src/components/GenericLink/GenericLink';
import Icons from 'src/components/Icons';
import { useUiConfig } from 'src/components/UiConfigContext';
import { URL_PARAMS } from 'src/constants';
import {
  MenuObjectChildProps,
  MenuObjectProps,
  MenuData,
} from 'src/types/bootstrapTypes';
import RightMenu from './RightMenu';

interface MenuProps {
  data: MenuData;
  isFrontendRoute?: (path?: string) => boolean;
}

const StyledHeader = styled.header`
  ${({ theme }) => `
      background-color: ${theme.colors.grayscale.light5};
      margin-bottom: 2px;
      z-index: 10;

      &:nth-last-of-type(2) nav {
        margin-bottom: 2px;
      }
      .caret {
        display: none;
      }
      .navbar-brand {
        display: flex;
        flex-direction: column;
        justify-content: center;
        /* must be exactly the height of the Antd navbar */
        min-height: 50px;
        padding: ${theme.gridUnit}px
          ${theme.gridUnit * 2}px
          ${theme.gridUnit}px
          ${theme.gridUnit * 4}px;
        max-width: ${theme.gridUnit * theme.brandIconMaxWidth}px;
        img {
          height: 100%;
          object-fit: contain;
        }
      }
      .navbar-brand-text {
        border-left: 1px solid ${theme.colors.grayscale.light2};
        border-right: 1px solid ${theme.colors.grayscale.light2};
        height: 100%;
        color: ${theme.colors.grayscale.dark1};
        padding-left: ${theme.gridUnit * 4}px;
        padding-right: ${theme.gridUnit * 4}px;
        margin-right: ${theme.gridUnit * 6}px;
        font-size: ${theme.gridUnit * 4}px;
        float: left;
        display: flex;
        flex-direction: column;
        justify-content: center;

        span {
          max-width: ${theme.gridUnit * 58}px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 1127px) {
          display: none;
        }
      }
      .main-nav .ant-menu-submenu-title > svg {
        top: ${theme.gridUnit * 5.25}px;
      }
      @media (max-width: 767px) {
        .navbar-brand {
          float: none;
        }
      }
      .ant-menu-horizontal .ant-menu-item {
        height: 100%;
        line-height: inherit;
      }
      .ant-menu > .ant-menu-item > a {
        padding: ${theme.gridUnit * 4}px;
      }
      @media (max-width: 767px) {
        .ant-menu-item {
          padding: 0 ${theme.gridUnit * 6}px 0
            ${theme.gridUnit * 3}px !important;
        }
        .ant-menu > .ant-menu-item > a {
          padding: 0px;
        }
        .main-nav .ant-menu-submenu-title > svg:nth-of-type(1) {
          display: none;
        }
        .ant-menu-item-active > a {
          &:hover {
            color: ${theme.colors.primary.base} !important;
            background-color: transparent !important;
          }
        }
      }
      .ant-menu-item a {
        &:hover {
          color: ${theme.colors.grayscale.dark1};
          background-color: ${theme.colors.primary.light5};
          border-bottom: none;
          margin: 0;
          &:after {
            opacity: 1;
            width: 100%;
          }
        }
      }
  `}
`;
const globalStyles = (theme: SupersetTheme) => css`
  .ant-menu-submenu.ant-menu-submenu-popup.ant-menu.ant-menu-light.ant-menu-submenu-placement-bottomLeft {
    border-radius: 0px;
  }
  .ant-menu-submenu.ant-menu-submenu-popup.ant-menu.ant-menu-light {
    border-radius: 0px;
  }
  .ant-menu-vertical > .ant-menu-submenu.data-menu > .ant-menu-submenu-title {
    height: 28px;
    i {
      padding-right: ${theme.gridUnit * 2}px;
      margin-left: ${theme.gridUnit * 1.75}px;
    }
  }
  .ant-menu-item-selected {
    background-color: transparent;
    &:not(.ant-menu-item-active) {
      color: inherit;
      border-bottom-color: transparent;
      & > a {
        color: inherit;
      }
    }
  }
  .ant-menu-horizontal > .ant-menu-item:has(> .is-active) {
    color: ${theme.colors.primary.base};
    border-bottom-color: ${theme.colors.primary.base};
    & > a {
      color: ${theme.colors.primary.base};
    }
  }
  .ant-menu-vertical > .ant-menu-item:has(> .is-active) {
    background-color: ${theme.colors.primary.light5};
    & > a {
      color: ${theme.colors.primary.base};
    }
  }
`;
const { SubMenu } = DropdownMenu;

const { useBreakpoint } = Grid;

export function Menu({
  data: {
    menu,
    brand,
    navbar_right: navbarRight,
    settings,
    environment_tag: environmentTag,
  },
  isFrontendRoute = () => false,
}: MenuProps) {
  const [showMenu, setMenu] = useState<MenuMode>('horizontal');
  const screens = useBreakpoint();
  const uiConfig = useUiConfig();
  const theme = useTheme();

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 767) {
        setMenu('inline');
      } else setMenu('horizontal');
    }
    handleResize();
    const windowResize = debounce(() => handleResize(), 10);
    window.addEventListener('resize', windowResize);
    return () => window.removeEventListener('resize', windowResize);
  }, []);

  enum Paths {
    Explore = '/explore',
    Dashboard = '/dashboard',
    Chart = '/chart',
    Datasets = '/tablemodelview',
  }

  const defaultTabSelection: string[] = [];
  const [activeTabs, setActiveTabs] = useState(defaultTabSelection);
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    switch (true) {
      case path.startsWith(Paths.Dashboard):
        setActiveTabs(['Dashboards']);
        break;
      case path.startsWith(Paths.Chart) || path.startsWith(Paths.Explore):
        setActiveTabs(['Charts']);
        break;
      case path.startsWith(Paths.Datasets):
        setActiveTabs(['Datasets']);
        break;
      default:
        setActiveTabs(defaultTabSelection);
    }
  }, [location.pathname]);

  const standalone = getUrlParam(URL_PARAMS.standalone);
  if (standalone || uiConfig.hideNav) return <></>;

  const renderSubMenu = ({
    label,
    childs,
    url,
    index,
    isFrontendRoute,
  }: MenuObjectProps) => {
    if (url && isFrontendRoute) {
      return (
        <DropdownMenu.Item key={label} role="presentation">
          <NavLink role="button" to={url} activeClassName="is-active">
            {label}
          </NavLink>
        </DropdownMenu.Item>
      );
    }
    if (url) {
      return (
        <DropdownMenu.Item key={label}>
          <a href={url}>{label}</a>
        </DropdownMenu.Item>
      );
    }
    return (
      <SubMenu
        key={index}
        title={label}
        icon={showMenu === 'inline' ? <></> : <Icons.TriangleDown />}
      >
        {childs?.map((child: MenuObjectChildProps | string, index1: number) => {
          if (typeof child === 'string' && child === '-' && label !== 'Data') {
            return <DropdownMenu.Divider key={`$${index1}`} />;
          }
          if (typeof child !== 'string') {
            return (
              <DropdownMenu.Item key={`${child.label}`}>
                {child.isFrontendRoute ? (
                  <NavLink
                    to={child.url || ''}
                    exact
                    activeClassName="is-active"
                  >
                    {child.label}
                  </NavLink>
                ) : (
                  <a href={child.url}>{child.label}</a>
                )}
              </DropdownMenu.Item>
            );
          }
          return null;
        })}
      </SubMenu>
    );
  };
  return (
    <StyledHeader className="top" id="main-menu" role="navigation">
      <Global styles={globalStyles(theme)} />
      <Row>
        <Col md={16} xs={24}>
          <Tooltip
            id="brand-tooltip"
            placement="bottomLeft"
            title="Welcome to Triomics"
            arrowPointAtCenter
          >
            {isFrontendRoute(window.location.pathname) ? (
              <GenericLink
                className="navbar-brand"
                to="/nurse/case-finding"
                tabIndex={-1}
                style={{ marginRight: '1rem' }}
              >
                <svg
                  preserveAspectRatio="xMidYMid meet"
                  data-bbox="0 0 147 21"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 147 21"
                  height="21"
                  width="147"
                  data-type="color"
                  role="presentation"
                  aria-hidden="true"
                  fill="#000000"
                  aria-label=""
                >
                  <g>
                    <path
                      fill="#000000"
                      d="M17.295 1.746c.084.843-.592 1.556-1.434 1.556h-5.3a.365.365 0 0 0-.369.363v10.502c0 .835-.69 1.513-1.54 1.513-.85 0-1.54-.678-1.54-1.513V3.665c0-.2-.166-.363-.37-.363H1.506c-.752 0-1.425-.538-1.499-1.274C-.077 1.185.6.472 1.442.472h14.354c.753 0 1.426.54 1.5 1.274Zm14.442 10.807a.457.457 0 0 0 .032.372l3.062 5.473c.241.432.277.96.042 1.395a1.432 1.432 0 0 1-1.275.755h-.185c-.53 0-1.018-.285-1.27-.743l-3.466-6.314a.827.827 0 0 0-.726-.426h-3.72a.365.365 0 0 0-.369.362v5.706c0 .782-.645 1.415-1.442 1.415h-.198c-.796 0-1.442-.633-1.442-1.415V1.59c0-.618.51-1.119 1.14-1.119h6.763c4.134 0 6.911 2.526 6.911 6.283 0 2.514-1.352 4.586-3.615 5.54a.434.434 0 0 0-.242.257v.001Zm.719-5.796c0-2.097-1.548-3.453-3.943-3.453h-4.506a.145.145 0 0 0-.146.144v6.428c0 .2.166.363.37.363h4.254c2.412 0 3.971-1.367 3.971-3.48v-.002ZM42.369.473h-.198c-.794 0-1.442.635-1.442 1.416v17.247c0 .78.647 1.415 1.442 1.415h.199c.794 0 1.442-.634 1.442-1.415V1.887c0-.78-.647-1.416-1.442-1.416v.002Zm50.934-.04h-.965c-.643 0-1.22.376-1.47.958l-6.155 14.323a.166.166 0 0 1-.157.103.16.16 0 0 1-.16-.102l-6.23-14.331a1.595 1.595 0 0 0-1.469-.952h-1.025c-.88 0-1.595.702-1.595 1.567V19.12c0 .796.658 1.442 1.469 1.442h.142c.81 0 1.469-.646 1.469-1.442V6.514l5.637 13.166c.23.537.761.883 1.355.883h.676c.594 0 1.125-.346 1.355-.884l5.637-13.166V19.12c0 .796.66 1.442 1.47 1.442h.141c.81 0 1.47-.646 1.47-1.442V1.998c0-.864-.716-1.567-1.596-1.567v.002Zm9.052.043h-.198c-.794 0-1.442.634-1.442 1.415v17.245c0 .78.646 1.415 1.442 1.415h.198c.795 0 1.442-.634 1.442-1.415V1.887c0-.78-.646-1.416-1.442-1.416v.004Zm37.842 8.545c-3.191-.538-5.129-1.008-5.129-3.012 0-1.831 1.495-2.925 4-2.925 2.173 0 3.863 1.062 4.412 2.774.188.588.739.982 1.369.982h.191c.46 0 .883-.207 1.161-.568.27-.352.355-.794.234-1.212-.858-2.947-3.681-4.777-7.366-4.777-4.169 0-7.081 2.412-7.081 5.866 0 3.989 3.411 5.089 6.746 5.64 3.132.522 5.185 1.022 5.185 3.123 0 1.855-1.631 3.008-4.254 3.008-2.624 0-4.397-1.248-4.918-3.257a1.444 1.444 0 0 0-1.399-1.083h-.194c-.44 0-.85.193-1.126.53a1.39 1.39 0 0 0-.283 1.198c.771 3.39 3.72 5.413 7.89 5.413 4.171 0 7.365-2.48 7.365-6.033 0-2.12-.773-4.68-6.802-5.667h-.001ZM69.831 10.5C69.83 16.291 65.033 21 59.135 21s-10.696-4.71-10.696-10.498C48.44 4.712 53.237 0 59.135 0s10.696 4.71 10.696 10.498v.004Zm-3.169 0c0-4.074-3.376-7.39-7.528-7.39-4.152 0-7.528 3.315-7.528 7.39 0 4.076 3.377 7.39 7.528 7.39 4.15 0 7.528-3.314 7.528-7.39Zm60.421 2.934c-.56 0-1.087.3-1.375.784-1.365 2.296-3.898 3.702-6.59 3.671-3.949-.047-7.209-3.11-7.424-6.975a7.253 7.253 0 0 1 2.05-5.494 7.528 7.528 0 0 1 5.467-2.308c2.638 0 5.117 1.389 6.468 3.624a1.598 1.598 0 0 0 2.746-.013 1.528 1.528 0 0 0-.015-1.577c-2.136-3.529-6.06-5.482-10.235-5.096-5.168.477-9.31 4.678-9.638 9.77-.189 2.937.832 5.73 2.875 7.865 2.014 2.106 4.857 3.314 7.798 3.314 3.794 0 7.338-2.003 9.247-5.226a1.512 1.512 0 0 0 .003-1.555 1.58 1.58 0 0 0-1.379-.784h.002ZM8.652 17.285c-.926 0-1.676.736-1.676 1.645 0 .908.75 1.644 1.676 1.644.925 0 1.675-.736 1.675-1.644 0-.909-.75-1.645-1.675-1.645Z"
                      data-color="1"
                    />
                  </g>
                </svg>
              </GenericLink>
            ) : (
              <a
                data-test="internal-link"
                className="navbar-brand"
                href="/nurse/case-finding"
                style={{ marginRight: '1rem' }}
              >
                <svg
                  preserveAspectRatio="xMidYMid meet"
                  data-bbox="0 0 147 21"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 147 21"
                  height="21"
                  width="147"
                  data-type="color"
                  role="presentation"
                  aria-hidden="true"
                  fill="#000000"
                  aria-label=""
                >
                  <g>
                    <path
                      fill="#000000"
                      d="M17.295 1.746c.084.843-.592 1.556-1.434 1.556h-5.3a.365.365 0 0 0-.369.363v10.502c0 .835-.69 1.513-1.54 1.513-.85 0-1.54-.678-1.54-1.513V3.665c0-.2-.166-.363-.37-.363H1.506c-.752 0-1.425-.538-1.499-1.274C-.077 1.185.6.472 1.442.472h14.354c.753 0 1.426.54 1.5 1.274Zm14.442 10.807a.457.457 0 0 0 .032.372l3.062 5.473c.241.432.277.96.042 1.395a1.432 1.432 0 0 1-1.275.755h-.185c-.53 0-1.018-.285-1.27-.743l-3.466-6.314a.827.827 0 0 0-.726-.426h-3.72a.365.365 0 0 0-.369.362v5.706c0 .782-.645 1.415-1.442 1.415h-.198c-.796 0-1.442-.633-1.442-1.415V1.59c0-.618.51-1.119 1.14-1.119h6.763c4.134 0 6.911 2.526 6.911 6.283 0 2.514-1.352 4.586-3.615 5.54a.434.434 0 0 0-.242.257v.001Zm.719-5.796c0-2.097-1.548-3.453-3.943-3.453h-4.506a.145.145 0 0 0-.146.144v6.428c0 .2.166.363.37.363h4.254c2.412 0 3.971-1.367 3.971-3.48v-.002ZM42.369.473h-.198c-.794 0-1.442.635-1.442 1.416v17.247c0 .78.647 1.415 1.442 1.415h.199c.794 0 1.442-.634 1.442-1.415V1.887c0-.78-.647-1.416-1.442-1.416v.002Zm50.934-.04h-.965c-.643 0-1.22.376-1.47.958l-6.155 14.323a.166.166 0 0 1-.157.103.16.16 0 0 1-.16-.102l-6.23-14.331a1.595 1.595 0 0 0-1.469-.952h-1.025c-.88 0-1.595.702-1.595 1.567V19.12c0 .796.658 1.442 1.469 1.442h.142c.81 0 1.469-.646 1.469-1.442V6.514l5.637 13.166c.23.537.761.883 1.355.883h.676c.594 0 1.125-.346 1.355-.884l5.637-13.166V19.12c0 .796.66 1.442 1.47 1.442h.141c.81 0 1.47-.646 1.47-1.442V1.998c0-.864-.716-1.567-1.596-1.567v.002Zm9.052.043h-.198c-.794 0-1.442.634-1.442 1.415v17.245c0 .78.646 1.415 1.442 1.415h.198c.795 0 1.442-.634 1.442-1.415V1.887c0-.78-.646-1.416-1.442-1.416v.004Zm37.842 8.545c-3.191-.538-5.129-1.008-5.129-3.012 0-1.831 1.495-2.925 4-2.925 2.173 0 3.863 1.062 4.412 2.774.188.588.739.982 1.369.982h.191c.46 0 .883-.207 1.161-.568.27-.352.355-.794.234-1.212-.858-2.947-3.681-4.777-7.366-4.777-4.169 0-7.081 2.412-7.081 5.866 0 3.989 3.411 5.089 6.746 5.64 3.132.522 5.185 1.022 5.185 3.123 0 1.855-1.631 3.008-4.254 3.008-2.624 0-4.397-1.248-4.918-3.257a1.444 1.444 0 0 0-1.399-1.083h-.194c-.44 0-.85.193-1.126.53a1.39 1.39 0 0 0-.283 1.198c.771 3.39 3.72 5.413 7.89 5.413 4.171 0 7.365-2.48 7.365-6.033 0-2.12-.773-4.68-6.802-5.667h-.001ZM69.831 10.5C69.83 16.291 65.033 21 59.135 21s-10.696-4.71-10.696-10.498C48.44 4.712 53.237 0 59.135 0s10.696 4.71 10.696 10.498v.004Zm-3.169 0c0-4.074-3.376-7.39-7.528-7.39-4.152 0-7.528 3.315-7.528 7.39 0 4.076 3.377 7.39 7.528 7.39 4.15 0 7.528-3.314 7.528-7.39Zm60.421 2.934c-.56 0-1.087.3-1.375.784-1.365 2.296-3.898 3.702-6.59 3.671-3.949-.047-7.209-3.11-7.424-6.975a7.253 7.253 0 0 1 2.05-5.494 7.528 7.528 0 0 1 5.467-2.308c2.638 0 5.117 1.389 6.468 3.624a1.598 1.598 0 0 0 2.746-.013 1.528 1.528 0 0 0-.015-1.577c-2.136-3.529-6.06-5.482-10.235-5.096-5.168.477-9.31 4.678-9.638 9.77-.189 2.937.832 5.73 2.875 7.865 2.014 2.106 4.857 3.314 7.798 3.314 3.794 0 7.338-2.003 9.247-5.226a1.512 1.512 0 0 0 .003-1.555 1.58 1.58 0 0 0-1.379-.784h.002ZM8.652 17.285c-.926 0-1.676.736-1.676 1.645 0 .908.75 1.644 1.676 1.644.925 0 1.675-.736 1.675-1.644 0-.909-.75-1.645-1.675-1.645Z"
                      data-color="1"
                    />
                  </g>
                </svg>
              </a>
            )}
          </Tooltip>
          {/* {brand.text && (
            <div className="navbar-brand-text">
              <span>Triomics</span>
            </div>
          )} */}
          <DropdownMenu
            mode={showMenu}
            data-test="navbar-top"
            className="main-nav"
            selectedKeys={activeTabs}
          >
            {menu.map((item, index) => {
              const props = {
                index,
                ...item,
                isFrontendRoute: isFrontendRoute(item.url),
                childs: item.childs?.map(c => {
                  if (typeof c === 'string') {
                    return c;
                  }

                  return {
                    ...c,
                    isFrontendRoute: isFrontendRoute(c.url),
                  };
                }),
              };

              return renderSubMenu(props);
            })}
          </DropdownMenu>
        </Col>
        <Col md={8} xs={24}>
          <RightMenu
            align={screens.md ? 'flex-end' : 'flex-start'}
            settings={settings}
            navbarRight={navbarRight}
            isFrontendRoute={isFrontendRoute}
            environmentTag={environmentTag}
          />
        </Col>
      </Row>
    </StyledHeader>
  );
}

// transform the menu data to reorganize components
export default function MenuWrapper({ data, ...rest }: MenuProps) {
  const newMenuData = {
    ...data,
    brand: {
      path: '',
      icon: '',
      alt: '',
      tooltip: '',
      text: '',
    },
  };
  // Menu items that should go into settings dropdown
  const settingsMenus = {
    Data: true,
    Security: true,
    Manage: true,
  };

  // Cycle through menu.menu to build out cleanedMenu and settings
  const cleanedMenu: MenuObjectProps[] = [];
  const settings: MenuObjectProps[] = [];
  newMenuData.menu.forEach((item: any) => {
    if (!item) {
      return;
    }

    const children: (MenuObjectProps | string)[] = [];
    const newItem = {
      ...item,
    };

    // Filter childs
    if (item.childs) {
      item.childs.forEach((child: MenuObjectChildProps | string) => {
        if (typeof child === 'string') {
          children.push(child);
        } else if ((child as MenuObjectChildProps).label) {
          children.push(child);
        }
      });

      newItem.childs = children;
    }

    if (!settingsMenus.hasOwnProperty(item.name)) {
      cleanedMenu.push(newItem);
    } else {
      settings.push(newItem);
    }
  });

  newMenuData.menu = cleanedMenu;
  newMenuData.settings = settings;

  return <Menu data={newMenuData} {...rest} />;
}
