export type PickTemplateCardProps = {
  href: string;
  name: string;
  tagline: string;
  tierLabel: string;
  priceText: string;
  cta: string;
  featuredLabel?: string;
  /** Names shown on the swatch, e.g. "Sara & Omar". */
  names: string;
  background: string;
  foreground: string;
};

export function PickTemplateCard(props: PickTemplateCardProps) {
  return (
    <a className="pick-card" href={props.href}>
      <span
        className="pick-card__swatch"
        style={{backgroundColor: props.background, color: props.foreground}}
        aria-hidden="true"
      >
        <span className="pick-card__names">{props.names}</span>
      </span>
      <span className="pick-card__body">
        <span className="pick-card__top">
          <strong className="pick-card__name">{props.name}</strong>
          {props.featuredLabel ? <span className="pick-card__badge">{props.featuredLabel}</span> : null}
        </span>
        <span className="pick-card__tagline">{props.tagline}</span>
        <span className="pick-card__meta">
          <span>{props.tierLabel}</span>
          <span dir="ltr">{props.priceText}</span>
        </span>
        <span className="pick-card__cta">{props.cta}</span>
      </span>
    </a>
  );
}
