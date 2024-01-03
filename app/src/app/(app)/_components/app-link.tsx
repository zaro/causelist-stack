import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import type { LinkOwnProps } from "@mui/material/Link";
import type { ButtonOwnProps } from "@mui/material/Button";
import NextLink from "next/link";
import type { LinkProps } from "next/link";

type AppLinkProps = LinkProps & LinkOwnProps;

type AppLinkPropsReal = React.PropsWithChildren<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof AppLinkProps> &
    AppLinkProps
>;

export function AppLink(props: AppLinkPropsReal) {
  const {
    children,
    classes,
    color,
    sx,
    TypographyClasses,
    underline,
    variant,
    ...nextLinkProps
  } = props;
  return (
    <NextLink legacyBehavior={true} {...nextLinkProps}>
      <Link
        classes={classes}
        color={color}
        sx={sx}
        TypographyClasses={TypographyClasses}
        underline={underline}
        variant={variant}
      >
        {children}
      </Link>
    </NextLink>
  );
}

type AppButtonLinkProps = LinkProps & ButtonOwnProps;

type AppButtonLinkPropsReal = React.PropsWithChildren<
  Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof AppButtonLinkProps
  > &
    AppButtonLinkProps
>;

export function AppButtonLink(props: AppButtonLinkPropsReal) {
  const { children, classes, color, sx, variant, ...nextLinkProps } = props;
  return (
    <NextLink legacyBehavior={true} {...nextLinkProps}>
      <Button classes={classes} color={color} sx={sx} variant={variant}>
        {children}
      </Button>
    </NextLink>
  );
}
