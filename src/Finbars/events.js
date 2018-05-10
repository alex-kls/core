'use strict';

/* eslint-disable */

/* eslint-env node, browser */

const orientationHashes = require('./orientationHashes');

/**
 *
 * @param finBar
 * @type {FinBar}
 * @constructor
 */
class FinBarTouch {
    constructor(finBar) {
        this.finBar = finBar;

        /**
         * @summary flag to detect is mouse was continuously clicked over scrollbar (not thumb)
         * @type {boolean}
         * @memberOf FinBarTouch.prototype
         */
        this.isTouchHoldOverBar = false;

        /**
         * @summary flag to detect is user touch starts over container (used to smooth scroll on mobile devices)
         * @type {boolean}
         * @memberOf FinBarTouch.prototype
         */
        this.isTouchHoldOverContainer = false;

        /**
         * @summary contains last detected position of user touch
         * @type {number|null}
         * @memberOf FinBarTouch.prototype
         */
        this.containerLastTouchPos = null;

        /**
         * @summary contains last detected user touch time (timestamp)
         * @type {number|null}
         * @memberOf FinBarTouch.prototype
         */
        this.containerLastTouchTime = null;

        /**
         * @summary contains current user touch move velocity
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.containerTouchVelocity = 0;

        // /**
        //  * @summary contains current user touch move velocity limit
        //  * @description use this variable for tuning kinetic scroll speed
        //  * @type {number}
        //  * @memberOf FinBarTouch.prototype
        //  */
        // this.containerTouchVelocityMax = 20000;

        // /**
        //  * @deprecated use containerTouchVelocityModifier from hashed instead
        //  * @summary multiplier for start scroll speed calculation
        //  * @description use this variable for tuning kinetic scroll speed
        //  * @type {number}
        //  * @memberOf FinBarTouch.prototype
        //  */
        // this.containerTouchVelocityModifier = 4.2;

        /**
         * @summary contains current user touch move amplitude
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.containerTouchAmplitude = 0;

        /**
         * @summary contains current smooth touch scroll interval. Used to smoothly scroll content
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.containerTouchScrollInterval = 0;

        /**
         * @summary contains current user touch move offset
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.containerTouchScrollOffset = null;

        /**
         * @summary contains current user touch move target. Used to detect end position of smooth scroll
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.containerTouchScrollTarget = null;

        this.isLastTouchOverBar = null;

        /**
         * @summary interval which used when mouse hold scroll performed
         * @desc table will be scrolled on one full page with this interval until mouse hold ends
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.mouseHoldPerformIntervalRate = 50;

        /**
         * @private
         * @summary utility field that contains mouseHold processing interval id
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.mouseHoldPerformInterval = 0;

        this.mouseHoldPerformIntervalCurrentCoordsObj = null;

        /**
         * @private
         * @summary utility field that contains timeout id, which used when moseHold processing starts
         * @type {number}
         * @memberOf FinBarTouch.prototype
         */
        this.mouseHoldPerformTimeout = 0;

        /**
         * @private
         * @summary flag to detect that user clicked over thumb, and scroll need to be performed exactly to that point
         * @type {boolean}
         * @memberOf FinBarTouch.prototype
         */
        this.isThumbDragging = true;

        /**
         * @private
         * @summary flag to detect that user start touch move over thumb, and scroll need to be placed based on mouse position
         * @type {boolean}
         * @memberOf FinBarTouch.prototype
         */
        this.isThumbTouchDragging = false;

        /**
         * @readonly
         * @name paging
         * @summary Enable page up/dn clicks.
         * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
         *
         * If truthy, listen for clicks in page-up and page-down regions of scrollbar.
         *
         * If an object, call `.paging.up()` on page-up clicks and `.paging.down()` will be called on page-down clicks.
         *
         * Changing the truthiness of this value after instantiation currently has no effect.
         * @type {boolean|object}
         * @memberOf FinBarTouch.prototype
         */
        this.paging = true;

    }

    /**
     * @private
     * @summary utility method to unify logic when user stops holding mouse on empty scroll bar space
     * @return {void}
     * @memberOf FinBarTouch.prototype
     */
    performMouseHoldOverBarEnd() {
        this.isTouchHoldOverBar = false;
        this.mouseHoldPerformIntervalCurrentCoordsObj = null;
        if (this.mouseHoldPerformInterval) {
            clearInterval(this.mouseHoldPerformInterval);
            this.mouseHoldPerformInterval = 0;
        }

        this.clearMouseHoldTimeout();
    }

    /**
     * @private
     * @summary utility method to perform clearing of an mouseHold timeout,
     * if user stops holding mouse before timeout function fork
     * @return {void}
     * @memberOf FinBarTouch.prototype
     */
    clearMouseHoldTimeout() {
        if (this.mouseHoldPerformTimeout) {
            clearTimeout(this.mouseHoldPerformTimeout);
            this.mouseHoldPerformTimeout = 0;
        }
    }

    _addEvt(evtName) {
        const spy = this.testPanelItem && this.testPanelItem[evtName];
        if (spy) {
            spy.classList.add('listening');
        }
        window.addEventListener(evtName, this['on' + evtName]);
    }

    _removeEvt(evtName) {
        const spy = this.testPanelItem && this.testPanelItem[evtName];
        if (spy) {
            spy.classList.remove('listening');
        }
        window.removeEventListener(evtName, this['on' + evtName]);
    }

    shortStop(evt) {
        evt.stopPropagation();
    }

    onwheel(evt) {
        let key = this.deltaProp;
        // swap coordinates if shift key pressed
        if (evt.shiftKey) {
            key = orientationHashes[key === orientationHashes.horizontal.delta ? 'vertical' : 'horizontal'].delta;
        }
        this.index += evt[key];
        evt.stopPropagation();
        evt.preventDefault();
    }

    onclick(evt) {
        this.thumb.addEventListener('transitionend', function waitForIt() {
            this.removeEventListener('transitionend', waitForIt);
            this.onmouseup(evt);
        }.bind(this));

        evt.stopPropagation();
    }

    onmouseout(evt) {
        this.performMouseHoldOverBarEnd();
    }

    onmousedown(evt) {
        const thumbBox = this.thumb.getBoundingClientRect();
        this.pinOffset = evt[this.oh.axis] - thumbBox[this.oh.leading] + this.bar.getBoundingClientRect()[this.oh.leading] + this.thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this._addEvt('mousemove');
        this._addEvt('mouseup');

        this._performCursorDown(evt);

        evt.stopPropagation();
        evt.preventDefault();
    }

    onbartouchstart(evt) {
        const thumbBox = this.thumb.getBoundingClientRect();
        this.pinOffset = evt.touches[0][this.oh.coordinate] - thumbBox[this.oh.leading] + this.bar.getBoundingClientRect()[this.oh.leading] + this.thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this._addEvt('touchend');
        this._addEvt('touchmove');

        this._performCursorDown(evt.touches[0]);
        this.isLastTouchOverBar = true;

        evt.stopPropagation();
        evt.preventDefault();
    }

    _performCursorDown(coordsObject) {
        let thumbBox = this.thumb.getBoundingClientRect();
        let mouseOverThumb = thumbBox.left <= coordsObject.clientX && coordsObject.clientX <= thumbBox.right &&
            thumbBox.top <= coordsObject.clientY && coordsObject.clientY <= thumbBox.bottom,
            mouseOverThumbCenter = false,
            goingUp = false,
            incrementValue = 0;

        if (!mouseOverThumb) {
            goingUp = coordsObject[this.oh.coordinate] < thumbBox[this.oh.leading];

            if (typeof this.paging === 'object') {
                this.index = this.paging[goingUp ? 'up' : 'down'](Math.round(this.index));
            } else {
                this.index += goingUp ? -this.increment : this.increment;
            }

            this.clearMouseHoldTimeout();
            this.mouseHoldPerformTimeout = setTimeout(() => {
                this.isTouchHoldOverBar = true;
                this.isThumbDragging = false;

                this.mouseHoldPerformIntervalCurrentCoordsObj = coordsObject;

                this.mouseHoldPerformInterval = setInterval(() => {
                    const co = this.mouseHoldPerformIntervalCurrentCoordsObj;
                    thumbBox = this.thumb.getBoundingClientRect();
                    mouseOverThumb = thumbBox.left <= co.clientX && co.clientX <= thumbBox.right &&
                        thumbBox.top <= co.clientY && co.clientY <= thumbBox.bottom;

                    const thumbCenterLeadingSide = (thumbBox[this.oh.leading] + thumbBox[this.oh.size] / 3);
                    const thumbCenterTrailingSide = (thumbBox[this.oh.trailing] - thumbBox[this.oh.size] / 3);
                    mouseOverThumbCenter = mouseOverThumb
                        && (thumbCenterLeadingSide <= co[this.oh.coordinate])
                        && (thumbCenterTrailingSide >= co[this.oh.coordinate]);

                    // goingUp value changed only if thumb not in cursor yet.
                    // Otherwise we can think, that scroll continuous and goingUp don't need to be changed
                    if (!mouseOverThumb) {
                        goingUp = co[this.oh.coordinate] < thumbBox[this.oh.leading];
                    }

                    incrementValue = goingUp ? -this.increment : this.increment;

                    if (this.isTouchHoldOverBar && !mouseOverThumbCenter) {
                        if (goingUp && (co[this.oh.coordinate] <= thumbCenterLeadingSide)
                            && ((this.index + incrementValue) <= 0)) {
                            this.index = 0;
                        } else {
                            this.index += incrementValue;
                        }
                    }

                    if (this.isTouchHoldOverBar && mouseOverThumbCenter) {
                        this.performMouseHoldOverBarEnd();
                    }
                }, this.mouseHoldPerformIntervalRate);
            }, 200);
        } else if (!this.isTouchHoldOverBar) {
            this.isThumbDragging = true;
        }
    }

    onmousemove(evt) {
        if (this.isThumbDragging) {
            const scaled = Math.min(this.thumbMax, Math.max(0, evt[this.oh.axis] - this.pinOffset));
            const idx = scaled / this.thumbMax * (this.max - this.min) + this.min;

            this._setScroll(idx, scaled);
        }

        if (this.isTouchHoldOverBar) {
            this.mouseHoldPerformIntervalCurrentCoordsObj = evt;
        }

        evt.stopPropagation();
        evt.preventDefault();
    }

    onmouseup(evt) {
        this.performMouseHoldOverBarEnd();
        this.isThumbDragging = false;

        this._removeEvt('mousemove');
        this._removeEvt('mouseup');

        document.documentElement.style.cursor = 'auto';

        evt.stopPropagation();
        evt.preventDefault();
    }

    trackTouchScroll() {
        const currentTimestamp = Date.now();
        const elapsed = currentTimestamp - this.containerLastTouchTime;
        this.containerLastTouchTime = currentTimestamp;
        const delta = this.containerTouchScrollOffset - this._touchScrollFrame;
        this._touchScrollFrame = this.containerTouchScrollOffset;
        const v = 1000 * delta / (1 + elapsed);
        this.containerTouchVelocity = this.oh.containerTouchVelocityModifier * v + 0.2 * this.containerTouchVelocity;
        // correct velocity with max value
        if (this.containerTouchVelocity < -this.oh.containerTouchVelocityMax) {
            this.containerTouchVelocity = -this.oh.containerTouchVelocityMax;
        }
        if (this.containerTouchVelocity > this.oh.containerTouchVelocityMax) {
            this.containerTouchVelocity = this.oh.containerTouchVelocityMax;
        }
    }

    ontouchstart(evt) {
        this.isTouchHoldOverContainer = true;
        this.isThumbTouchDragging = false;
        this.containerLastTouchPos = evt.touches[0][this.oh.coordinate];
        this.containerLastTouchTime = Date.now();

        this._touchScrollFrame = this.containerTouchScrollOffset;
        this.containerTouchVelocity = this.containerTouchAmplitude = 0;

        this.isLastTouchOverBar = false;
        this.containerTouchScrollOffset = this.index;
        this.containerTouchScrollInterval = setInterval(this.trackTouchScroll, 100);

        evt.preventDefault();
        evt.stopPropagation();
    }

    getPos(e) {
        // touch event
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0][this.oh.coordinate];
        }
        if (e.touches && (e.touches.length >= 1)) {
            return e.touches[0][this.oh.coordinate];
        }

        // mouse event
        return e[this.oh.coordinate];
    }

    onthumbtouchstart(evt) {
        const thumbBox = this.thumb.getBoundingClientRect();
        let currentMovePos = this.getPos(evt);
        this.pinOffset = currentMovePos - thumbBox[this.oh.leading] + this.bar.getBoundingClientRect()[this.oh.leading] + this.thumbMarginLeading;

        this.isThumbTouchDragging = true;
        this.containerLastTouchPos = null;

        this._addEvt('touchend');
        this._addEvt('touchmove');

        evt.stopPropagation();
        evt.preventDefault();
    }

    ontouchend(evt) {
        if (this.isTouchHoldOverContainer) {
            this.isTouchHoldOverContainer = false;
            clearInterval(this.containerTouchScrollInterval);
            this.trackTouchScroll();
            if (this.containerTouchVelocity > 10 || this.containerTouchVelocity < -10) {
                this.containerTouchAmplitude = 0.8 * this.containerTouchVelocity;
                this.containerTouchScrollTarget = Math.round(this.containerTouchScrollOffset + this.containerTouchAmplitude);
                this.containerLastTouchTime = Date.now();
                requestAnimationFrame(this._performTouchAutoScroll);
            }
        }


        this.isThumbTouchDragging = false;
        this.isTouchHoldOverContainer = false;
        this.containerLastTouchPos = null;

        this.performMouseHoldOverBarEnd();

        this._removeEvt('touchend');
        this._removeEvt('touchmove');

        evt.stopPropagation();
        evt.preventDefault();
    }

    _performTouchAutoScroll() {
        if (this.containerTouchAmplitude) {
            const elapsed = Date.now() - this.containerLastTouchTime;
            const delta = -this.containerTouchAmplitude * Math.exp(-elapsed / 325);
            if (delta > 0.5 || delta < -0.5) {
                this._performTouchScroll(this.containerTouchScrollTarget + delta);
                requestAnimationFrame(this._performTouchAutoScroll);
            } else {
                this._performTouchScroll(this.containerTouchScrollTarget);
            }
        }
    }

    _performTouchScroll(y) {
        const newOffset = (y > this.max) ? this.max : (y < this.min) ? this.min : y;
        if (newOffset !== this.containerTouchScrollOffset) {
            this.containerTouchScrollOffset = newOffset;
            this._setScroll(this.containerTouchScrollOffset);
        }
    }

    ontouchmove(evt) {
        if (this.isThumbTouchDragging) {
            let currentMovePos = this.getPos(evt);

            let scaled = Math.min(this.thumbMax, Math.max(0, currentMovePos - this.pinOffset));
            let idx = scaled / this.thumbMax * (this.max - this.min) + this.min;

            this._setScroll(idx, scaled);
        } else if (this.isTouchHoldOverContainer) {
            const pos = this.getPos(evt);
            let delta = this.containerLastTouchPos - pos;
            delta = delta * this.oh.touchScrollOffsetCoefficient;
            if (delta > 2 * this.oh.touchScrollOffsetCoefficient || delta < -2 * this.oh.touchScrollOffsetCoefficient) {
                this.containerLastTouchPos = pos;
                this._performTouchScroll(this.containerTouchScrollOffset + delta);
            }
        } else if (this.isLastTouchOverBar) {
            const boundsBox = this.bar.getBoundingClientRect();
            const touchOverBar = boundsBox.left <= evt.touches[0].clientX && evt.touches[0].clientX <= boundsBox.right &&
                boundsBox.top <= evt.touches[0].clientY && evt.touches[0].clientY <= boundsBox.bottom;

            if (!touchOverBar) {
                this.performMouseHoldOverBarEnd();
            }
        }

        if (this.mouseHoldPerformIntervalCurrentCoordsObj) {
            this.mouseHoldPerformIntervalCurrentCoordsObj = evt.touches[0];
        }

        evt.stopPropagation();
        evt.preventDefault();
    }

    _setScroll(idx, scaled) {
        this.finBar._setScroll(idx, scaled);
    }

    get min() {
        return this.finBar.min;
    }

    get max() {
        return this.finBar.max;
    }

    get bar() {
        return this.finBar.bar;
    }

    get thumb() {
        return this.finBar.thumb;
    }

    get thumbMax() {
        return this.finBar.thumbMax;
    }

    get oh() {
        return this.finBar.oh;
    }

    get deltaProp() {
        return this.finBar.deltaProp;
    }

    get thumbMarginLeading() {
        return this.finBar.thumbMarginLeading;
    }

    get testPanelItem() {
        return this.finBar.testPanelItem;
    }

    set index(val) {
        this.finBar.index = val;
    }

    get index() {
        return this.finBar.index;
    }

    get increment() {
        return this.finBar.increment;
    }
}

// Interface
module.exports = FinBarTouch;
