import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { TemplateHeader } from './TemplateHeader'
import { Icon } from './Icon'
import { resolveNavigationToggleTranslations, type AuthTemplateHeaderTranslations } from './scripts';
import './AuthTemplateHeaderVisual.scss';

interface AuthTemplateHeaderVisualProps extends ComponentPropsWithRef<'div'> {
  nonInteractive?: boolean;
  navigationOpen?: boolean;
  translations?: AuthTemplateHeaderTranslations;
  toggleProps?: Record<string, unknown>;
  panelProps?: Record<string, unknown>;
  brand?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
}

export function AuthTemplateHeaderVisual(props: AuthTemplateHeaderVisualProps) {
  const { nonInteractive, navigationOpen, translations, toggleProps, panelProps, brand, navigation, actions, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiAuthTemplateHeader');

  return (
    <div
      {...rest}
      style={style}
      className={bem(undefined, { 'nav-open': navigationOpen }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <TemplateHeader
        brand={
          <>
            {props.brand}
          </>
        }
        navigation={
          <nav {...panelProps} className="DjuiAuthTemplateHeader__navigation">
            <div className="DjuiAuthTemplateHeader__navigation-inner">
              {props.navigation}
              {nonInteractive ? (
                <div className="DjuiAuthTemplateHeader__navigation-toggle">
                  <div
                    className="DjuiAuthTemplateHeader__navigation-toggle-face DjuiAuthTemplateHeader__navigation-toggle-face--menu"
                  >
                    <Icon name="menu" />
                  </div>
                  <div
                    className="DjuiAuthTemplateHeader__navigation-toggle-face DjuiAuthTemplateHeader__navigation-toggle-face--close"
                  >
                    <Icon name="x" />
                  </div>
                </div>
              ) : (
                <button
                  {...toggleProps}
                  className="DjuiAuthTemplateHeader__navigation-toggle"
                  type="button"
                  aria-label={resolveNavigationToggleTranslations(translations).navigationToggleLabel}
                >
                  <div
                    className="DjuiAuthTemplateHeader__navigation-toggle-face DjuiAuthTemplateHeader__navigation-toggle-face--menu"
                  >
                    <Icon name="menu" />
                  </div>
                  <div
                    className="DjuiAuthTemplateHeader__navigation-toggle-face DjuiAuthTemplateHeader__navigation-toggle-face--close"
                  >
                    <Icon name="x" />
                  </div>
                </button>
              )}
            </div>
          </nav>
        }
        actions={
          <>
            {props.actions}
          </>
        }
      />
    </div>
  );
}
