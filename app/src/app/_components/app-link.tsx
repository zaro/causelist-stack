import Link from "@mui/material/Link";
import type { LinkOwnProps } from "@mui/material/Link";
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
