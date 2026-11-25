// US-23: Nội dung bài viết — đoạn cách nhau bởi dòng trống, dòng bắt đầu bằng "## " là tiêu đề mục
export function PostContent({ content }: { content: string }) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className='space-y-5 text-[17px] leading-relaxed text-ink'>
      {blocks.map((block, i) =>
        block.startsWith('## ') ? (
          <h2 key={i} className='pt-3 font-display text-2xl font-bold text-moss'>
            {block.slice(3)}
          </h2>
        ) : (
          <p key={i} className='whitespace-pre-line'>
            {block}
          </p>
        )
      )}
    </div>
  )
}
