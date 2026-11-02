// One community's feed: composer, posts, comments, reactions, polls, saving, reporting.
import { useMemo, useState } from 'react'
import { useCollection, useCurrentUser } from '../store.js'
import { Badge, Confirm, Empty, Field, Modal, TextPrompt, Who, finish, useForm } from '../components/ui.jsx'
import { OpportunityForm } from './projectforms.jsx'
import {
  POST_TYPES, REACTIONS, addComment, createPost, deletePost, isModerator, isVisible,
  pinPost, reportEntity, toggleReaction, toggleSave, votePoll
} from '../community.js'
import { fmtDate } from '../util.js'
import { CATEGORIES } from '../collab.js'

// The community a post came from suggests a starting category (the student can change it).
const guessCategory = (c) => (!c ? '' : CATEGORIES.includes(c.name) ? c.name : c.type === 'general' ? 'Campus improvement' : '')

const TYPE_LABEL = { discussion: 'Discussion', question: 'Question', resource: 'Resource', poll: 'Poll', announcement: 'Announcement' }

function Composer({ community, onClose }) {
  const user = useCurrentUser()
  const { values, bind } = useForm({ postType: 'discussion', title: '', content: '', sourceUrl: '', pollOptions: '' })
  const [errors, setErrors] = useState({})
  const t = values.postType
  const submit = (e) => {
    e.preventDefault()
    if (finish(createPost(user.id, community.id, values), setErrors, 'Post published')) onClose()
  }
  return (
    <Modal title={`Post in ${community.name}`} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <Field label="Post type" error={errors.postType}>
          <select {...bind('postType')}>{POST_TYPES.map((p) => <option key={p} value={p}>{TYPE_LABEL[p]}{p === 'announcement' && !isModerator(user.id) ? ' (suggestion)' : ''}</option>)}</select>
        </Field>
        <Field label="Title" error={errors.title}><input autoFocus {...bind('title')} /></Field>
        {t !== 'poll' && (
          <Field label={t === 'resource' ? 'Why is it useful? (optional)' : 'Details'} error={errors.content}><textarea rows="4" {...bind('content')} /></Field>
        )}
        {t === 'resource' && <Field label="Link" error={errors.sourceUrl}><input type="url" placeholder="https://" {...bind('sourceUrl')} /></Field>}
        {t === 'poll' && <Field label="Options" hint="One per line, 2 to 6 options." error={errors.pollOptions}><textarea rows="4" {...bind('pollOptions')} /></Field>}
        {t === 'announcement' && !isModerator(user.id) && <p className="muted">Your announcement is a suggestion. A moderator decides whether to pin it.</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Publish</button>
        </div>
      </form>
    </Modal>
  )
}

function Poll({ post, user }) {
  const votes = useCollection('votes').filter((v) => v.postId === post.id)
  const mine = votes.find((v) => v.userId === user.id)
  return (
    <div className="poll">
      {post.pollOptions.map((o) => {
        const n = votes.filter((v) => v.optionId === o.id).length
        const pct = votes.length ? Math.round((n / votes.length) * 100) : 0
        return (
          <div key={o.id} className={`poll-opt ${mine?.optionId === o.id ? 'mine' : ''}`}>
            <div className="poll-fill" style={{ width: `${pct}%` }} />
            <span className="poll-text">{o.text}{mine?.optionId === o.id && ' (your vote)'}</span>
            <span className="poll-n">{n} · {pct}%</span>
            {!mine && <button className="btn small" onClick={() => finish(votePoll(user.id, post.id, o.id), null, 'Vote recorded')}>Vote</button>}
          </div>
        )
      })}
      <small className="muted">{votes.length} vote{votes.length === 1 ? '' : 's'}. One vote per person, and votes cannot be changed.</small>
    </div>
  )
}

function Comment({ comment, post, user, depth }) {
  const all = useCollection('comments')
  const [replying, setReplying] = useState(false)
  const [reporting, setReporting] = useState(false)
  const kids = all.filter((c) => c.postId === post.id && c.parentCommentId === comment.id && c.status !== 'hidden')
  const removed = comment.status === 'removed'
  return (
    <div className="comment" style={{ marginLeft: Math.min(depth, 3) * 16 }}>
      {removed ? <p className="muted">[removed by a moderator]</p> : (
        <>
          <p className="meta"><Who id={comment.authorId} /> · {fmtDate(comment.createdAt)}</p>
          <p>{comment.content}</p>
          <div className="actions left">
            <button className="link-btn" onClick={() => setReplying(!replying)}>Reply</button>
            {comment.authorId !== user.id && <button className="link-btn" onClick={() => setReporting(true)}>Report</button>}
          </div>
        </>
      )}
      {replying && <ReplyBox post={post} user={user} parentId={comment.id} onDone={() => setReplying(false)} />}
      {kids.map((k) => <Comment key={k.id} comment={k} post={post} user={user} depth={depth + 1} />)}
      {reporting && (
        <TextPrompt title="Report this comment" label="What is the problem?" field="reason" submitLabel="Send report" success="Report sent to the moderators"
          onSubmit={(r) => reportEntity(user.id, 'comment', comment.id, r)} onClose={() => setReporting(false)} />
      )}
    </div>
  )
}

function ReplyBox({ post, user, parentId = null, onDone }) {
  const { values, bind, set } = useForm({ text: '' })
  const [errors, setErrors] = useState({})
  const send = (e) => {
    e.preventDefault()
    if (finish(addComment(user.id, post.id, values.text, parentId), setErrors)) { set('text', ''); if (onDone) onDone() }
  }
  return (
    <form className="reply" onSubmit={send} noValidate>
      <input placeholder={parentId ? 'Write a reply' : 'Write a comment'} aria-label="Comment" {...bind('text')} />
      <button className="btn small" type="submit">Post</button>
      {errors.content && <small className="err">{errors.content}</small>}
    </form>
  )
}

function PostCard({ post, user, showCommunity }) {
  const communities = useCollection('communities')
  const reactions = useCollection('reactions').filter((r) => r.postId === post.id)
  const comments = useCollection('comments').filter((c) => c.postId === post.id && c.status !== 'hidden')
  const saved = useCollection('saved').some((s) => s.postId === post.id && s.userId === user.id)
  const [open, setOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bridging, setBridging] = useState(false)
  const spawned = useCollection('opportunities').filter((o) => o.sourcePostId === post.id)
  const mod = isModerator(user.id)
  const announce = post.postType === 'announcement'

  return (
    <article className={`card post ${announce ? 'announce' : ''} ${post.pinned ? 'pinned' : ''}`}>
      <div className="row">
        <span className="tags">
          {post.pinned && <Badge tone="accent">pinned</Badge>}
          <Badge tone={announce ? 'accent' : ''}>{announce && post.authorId !== 'mod_001' && !isModerator(post.authorId) ? 'announcement suggestion' : TYPE_LABEL[post.postType]}</Badge>
          {showCommunity && <Badge>{communities.find((c) => c.id === post.communityId)?.name}</Badge>}
          {mod && post.status === 'reported' && <Badge tone="warn">reported</Badge>}
        </span>
        <small className="muted">{fmtDate(post.createdAt)}</small>
      </div>
      <h3>{post.title}</h3>
      <p className="meta">By <Who id={post.authorId} /></p>
      {post.content && <p className="body">{post.content}</p>}
      {spawned.length > 0 && <p className="meta">Became a project: {spawned.map((o) => <a key={o.id} className="who" href={`#/projects/${o.id}`}>{o.title} </a>)}</p>}
      {post.postType === 'resource' && <a className="ext" href={post.sourceUrl} target="_blank" rel="noopener noreferrer">{post.sourceUrl}</a>}
      {post.postType === 'poll' && <Poll post={post} user={user} />}

      <div className="reactions">
        {REACTIONS.map((r) => {
          const n = reactions.filter((x) => x.reactionType === r).length
          const on = reactions.some((x) => x.reactionType === r && x.userId === user.id)
          return <button key={r} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => finish(toggleReaction(user.id, post.id, r), null)}>{r} {n > 0 && n}</button>
        })}
        <button className="chip" onClick={() => setOpen(!open)}>{open ? 'Hide comments' : `Comments (${comments.length})`}</button>
        <button className={`chip ${saved ? 'on' : ''}`} aria-pressed={saved} onClick={() => finish(toggleSave(user.id, post.id), null, saved ? 'Removed from saved' : 'Saved')}>{saved ? 'Saved' : 'Save'}</button>
        {mod && <button className="chip" onClick={() => finish(pinPost(user.id, post.id, !post.pinned), null, post.pinned ? 'Unpinned' : 'Pinned')}>{post.pinned ? 'Unpin' : 'Pin'}</button>}
        {['discussion', 'question'].includes(post.postType) && <button className="chip" onClick={() => setBridging(true)}>Turn into project</button>}
        {post.authorId !== user.id && <button className="chip" onClick={() => setReporting(true)}>Report</button>}
        {(post.authorId === user.id || mod) && <button className="chip" onClick={() => setDeleting(true)}>Delete</button>}
      </div>

      {open && (
        <div className="thread">
          {comments.filter((c) => !c.parentCommentId).map((c) => <Comment key={c.id} comment={c} post={post} user={user} depth={0} />)}
          {comments.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}
          <ReplyBox post={post} user={user} />
        </div>
      )}
      {bridging && <OpportunityForm prefill={{ title: post.title, description: post.content, sourcePostId: post.id, category: guessCategory(communities.find((c) => c.id === post.communityId)) }} onClose={() => setBridging(false)} />}
      {reporting && (
        <TextPrompt title="Report this post" label="What is the problem?" field="reason" submitLabel="Send report" success="Report sent to the moderators"
          onSubmit={(r) => reportEntity(user.id, 'post', post.id, r)} onClose={() => setReporting(false)} />
      )}
      {deleting && (
        <Confirm title="Delete this post?" danger label="Delete" text="The post and its comments will disappear from the feed."
          onConfirm={() => finish(deletePost(user.id, post.id), null, 'Post deleted')} onClose={() => setDeleting(false)} />
      )}
    </article>
  )
}

export default function Feed({ community }) {
  const user = useCurrentUser()
  const posts = useCollection('posts')
  const reactions = useCollection('reactions')
  const saved = useCollection('saved')
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('newest')
  const [onlySaved, setOnlySaved] = useState(false)
  const [composing, setComposing] = useState(false)

  const list = useMemo(() => {
    const text = q.trim().toLowerCase()
    const score = (p) => reactions.filter((r) => r.postId === p.id).length
    return posts
      .filter((p) => p.communityId === community.id && isVisible(p))
      .filter((p) => type === 'all' || p.postType === type)
      .filter((p) => !onlySaved || saved.some((s) => s.postId === p.id && s.userId === user.id))
      .filter((p) => !text || `${p.title} ${p.content}`.toLowerCase().includes(text))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) ||
        (sort === 'reacted' ? score(b) - score(a) : 0) || b.createdAt.localeCompare(a.createdAt))
  }, [posts, reactions, saved, community.id, q, type, sort, onlySaved, user.id])

  return (
    <>
      <div className="row bar-row">
        <div className="filters tight">
          <input type="search" placeholder="Search this community" aria-label="Search posts" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Post type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {POST_TYPES.map((p) => <option key={p} value={p}>{TYPE_LABEL[p]}</option>)}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="reacted">Most reacted</option>
          </select>
          <label className="check"><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> Saved only</label>
        </div>
        <button className="btn" onClick={() => setComposing(true)}>New post</button>
      </div>
      {list.length === 0 ? (
        <Empty title={onlySaved ? 'No saved posts here' : 'No posts match'} text="Be the first to post, or adjust the filters." />
      ) : (
        <div className="stack">{list.map((p) => <PostCard key={p.id} post={p} user={user} />)}</div>
      )}
      {composing && <Composer community={community} onClose={() => setComposing(false)} />}
    </>
  )
}
