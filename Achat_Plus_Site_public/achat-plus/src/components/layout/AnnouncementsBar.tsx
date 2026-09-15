import { useListAnnouncements } from "@workspace/api-client-react"

interface AnnouncementBanner {
  id: number
  title?: string
  body?: string
  imageUrl?: string | null
  linkUrl?: string | null
  bgColor?: string
  textColor?: string
  [key: string]: unknown
}

const MARQUEE_CSS = `
@keyframes announcement-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.announcement-marquee-track {
  display: flex;
  width: max-content;
  animation: announcement-marquee 28s linear infinite;
}
.announcement-marquee:hover .announcement-marquee-track {
  animation-play-state: paused;
}
`

export function AnnouncementsBar() {
  const { data } = useListAnnouncements()
  const banners = (data || []) as AnnouncementBanner[]

  if (banners.length === 0) return null

  const first = banners[0]
  const bgColor = first.bgColor || "#ed671c"
  const textColor = first.textColor || "#ffffff"

  // Toutes les annonces une à la suite de l'autre dans la piste (dupliquée pour un défilement sans fin).
  const entry = (banner: AnnouncementBanner, keySuffix: string) => (
    <div key={banner.id + keySuffix} className="flex shrink-0 items-center gap-3 px-6 whitespace-nowrap">
      {banner.imageUrl ? (
        <img src={banner.imageUrl} alt="" className="h-5 w-auto object-contain shrink-0" />
      ) : null}
      <span className="text-sm font-semibold">
        {banner.title ? `${banner.title}${banner.body ? " · " : ""}` : ""}
        {banner.body}
      </span>
      {banners.length > 1 ? <span className="opacity-70">◆</span> : null}
    </div>
  )

  const content = (
    <div className="announcement-marquee overflow-hidden select-none">
      <style>{MARQUEE_CSS}</style>
      <div className="announcement-marquee-track">
        <div className="flex shrink-0 items-center">{banners.map((b) => entry(b, "-a"))}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{banners.map((b) => entry(b, "-b"))}</div>
      </div>
    </div>
  )

  return (
    <div
      className="relative overflow-hidden py-2"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {first.linkUrl ? (
        <a href={first.linkUrl} target="_blank" rel="noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}
