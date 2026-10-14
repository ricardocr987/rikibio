type SectionHeadingProps = {
  index: string;
  title: string;
};

export function SectionHeading({ index, title }: SectionHeadingProps) {
  return (
    <div className="mb-10 flex items-baseline gap-4">
      <span className="font-mono text-xs tracking-[0.14em] text-signal">
        {index}
      </span>
      <h2 className="font-display text-4xl tracking-tight text-paper md:text-5xl">
        {title}
      </h2>
    </div>
  );
}
