type Props = {
  name: string;
  src?: string;
  size?: number;
  tone?: "stamp" | "postage" | "sky" | "warning";
};

const tones: Record<NonNullable<Props["tone"]>, string> = {
  stamp: "bg-stamp/20 text-stamp",
  postage: "bg-postage/20 text-postage",
  sky: "bg-sky/30 text-postage",
  warning: "bg-warning/25 text-warning",
};

export function Avatar({ name, src, size = 40, tone = "postage" }: Props) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full hairline overflow-hidden ${tones[tone]}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-display font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
