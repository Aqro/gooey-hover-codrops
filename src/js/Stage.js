import { TweenMax as TM } from 'gsap/all'
import Scrollbar from 'smooth-scrollbar'
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll'
import { map } from './utils/utils'

import Scene from './Scene'
import HorizontalScrollPlugin from './utils/HorizontalScrollPlugin'

Scrollbar.use(HorizontalScrollPlugin, OverscrollPlugin)

const offsetTitle = 100


export default class Stage {

    constructor() {
        this.progress = 0

        this.$els = {
            title       : document.querySelector('.page-title'),
            progress    : document.querySelector('.slideshow__progress'),
            progressCtn : document.querySelector('.slideshow__progress-ctn'),
            scene       : document.getElementById('scene'),
        }


        this.init()

        this.bindEvents()
    }

    bindEvents() {
        document.addEventListener('lockScroll', ({ detail }) => { this.lockScroll(detail) })

        this.Scroll.addListener((s) => { this.onScroll(s) })
    }

    init() {
        this.Scroll = Scrollbar.init(document.querySelector('.scrollarea'), {
            delegateTo: document,
            continuousScrolling : false,
            overscrollEffect: 'bounce',
            damping: 0.05,
            plugins: {
                horizontalScroll: {
                    events: [/wheel/],
                },
            },
        })

        this.Scroll.track.xAxis.element.remove()
        this.Scroll.track.yAxis.element.remove()

        Scrollbar.detachStyle()

        this.updateScrollBar()

        this.scene = new Scene(this.$els.scene)
    }


    /* Handlers
    --------------------------------------------------------- */

    onScroll({ limit, offset }) {
        this.progress = offset.x / limit.x

        TM.to(this.$els.title, 0.3, { x: -this.progress * offsetTitle, force3D: true })
        this.updateScrollBar()
    }

    /* Actions
    --------------------------------------------------------- */

    updateScrollBar() {
        const progress = map(this.progress * 100, 0, 100, 5, 100)
        TM.to(this.$els.progress, 0.3, { xPercent: progress, force3D: true })
    }

    lockScroll({ lock }) {
        const duration = lock ? 0 : 1.8

        TM.delayedCall(duration, () => {
            this.Scroll.updatePluginOptions('horizontalScroll', {
                events: lock ? [] : [/wheel/],
            })
            TM.to(this.$els.progressCtn, 0.5, {
                alpha: lock ? 0 : 1,
                force3D: true,
            })
        })
    }

    /* Values
    --------------------------------------------------------- */


}
