export default function Section({
  videoSrc,
  title,
  children
}: { videoSrc: string; title: string } & React.PropsWithChildren) {
  return (
    <>
      <h2>{title}</h2>
      <div className='sm:flex sm:space-x-2 items-start w-full'>
        <ul className='w-1/3 min-w-[200px]'>{children}</ul>
        <video
          className='w-2/3 max-w-[100vw-250px]'
          muted
          controls
          src={videoSrc}></video>
      </div>
    </>
  )
}
