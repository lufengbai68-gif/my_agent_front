import { usingMock } from '../api'

export function Header() {
  return (
    <header className="jm-header">
      <div className="jm-header__inner">
        <div className="jm-header__brand">
          <span className="jm-header__logo" aria-hidden="true" />
          <div>
            <h1 className="jm-header__title">即梦 AI 创作</h1>
            <p className="jm-header__subtitle">描述你的创意，生成图片与视频</p>
          </div>
        </div>
        <span className={`jm-header__tag ${usingMock ? '' : 'is-live'}`}>
          {usingMock ? 'Mock 模式' : '真实 API'}
        </span>
      </div>
    </header>
  )
}
