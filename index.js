if (typeof window === 'undefined') {
  throw new Error('This module only works in the browser.')
}

const { addEventListener, history, dispatchEvent, location } = window
import { pathToRegexp, match } from 'path-to-regexp'

const routes = []

function handle(path) {
  const matched = routes.filter(r => r.regexp.exec(path))
  if (matched.length === 0) {
    console.log('No route match.', path)
    return false
  }
  for (let route of matched) {
    const { controller, match, name } = route
    const data = match(path)
    controller.apply({}, [{ name, ...data }])
    return true
  }
}

const Router = {
  config({
    base = '/',
    controller = () => {
      console.log('Default Controller');
    }
  }) {
    this.controller = controller
    if (base[0] !== '/') {
      console.error('Base must start with a /');
      return
    }
    if (base !== '/' && [base.length - 1] === '/') {
      console.error('Base can not end with a /');
      return
    }
    this.base = base
    return this
  },
  add({ path, controller = this.controller, name } = {}) {
    let thePath = path
    const pathType = Object.prototype.toString.call(path)
    const { base } = this
    if (path[0] !== '/' && path !== '*') {
      console.error('Path must start with a /');
      return
    }
    if (path === '*') {
      thePath = /.*/
    }
    if (base !== '/') {
      if (pathType === '[object RegExp]') {
        // Add base to the beginning of the path
      }
      if (pathType === '[object String]') {
        thePath = path === '/' ? base : base + path
      }
    }
    routes.push({ name, thePath, controller, regexp: pathToRegexp(thePath), match: match(thePath) })
    return this
  },
  start() {
    const { pathname, hash } = location
    const path = pathname + hash
    handle(path)
  }
}

addEventListener('click', function (event) {
  const { target } = event
  if (target.tagName === 'A') {
    const { href, dataset } = target
    const { origin, pathname, hash, search } = new URL(href)
    if (origin !== location.origin) return
    if (dataset.router && dataset.router.toLowerCase() === 'ignore') return
    if (href.match(/^mailto:/)) return
    if (href.match(/^tel:/)) return
    if (href.match(/^javascript:/)) return
    if (pathname.match(/^#/)) return
    event.preventDefault()
    history.pushState({}, '', pathname + hash + search)
    dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  }
})

addEventListener('popstate', () => {
  Router.start()
})

export default Router
