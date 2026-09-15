import watermarkPath from "@assets/Achat.png"

interface ProductImageProps {
  src?: string | null
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const hasImage = Boolean(src)
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted">
      {hasImage ? (
        <img
          src={watermarkPath}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto h-3/5 w-3/5 object-contain opacity-[0.10] grayscale"
        />
      ) : null}
      <img
        src={src || watermarkPath}
        alt={alt}
        className={`relative ${className} ${hasImage ? "" : "p-4"}`}
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = watermarkPath
          event.currentTarget.classList.add("object-contain", "p-4")
        }}
      />
    </div>
  )
}
