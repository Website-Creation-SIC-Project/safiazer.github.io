
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* node_modules\saos\src\Saos.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules\\saos\\src\\Saos.svelte";

    // (75:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "animation: " + /*animation_out*/ ctx[1] + "; " + /*css_animation*/ ctx[3]);
    			add_location(div, file$2, 75, 4, 2229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*animation_out, css_animation*/ 10 && div_style_value !== (div_style_value = "animation: " + /*animation_out*/ ctx[1] + "; " + /*css_animation*/ ctx[3])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(75:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:2) {#if observing}
    function create_if_block$1(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "animation: " + /*animation*/ ctx[0] + "; " + /*css_animation*/ ctx[3]);
    			add_location(div, file$2, 71, 4, 2135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*animation, css_animation*/ 9 && div_style_value !== (div_style_value = "animation: " + /*animation*/ ctx[0] + "; " + /*css_animation*/ ctx[3])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(71:2) {#if observing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*observing*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "id", /*countainer*/ ctx[5]);
    			attr_dev(div, "style", /*css_observer*/ ctx[2]);
    			add_location(div, file$2, 69, 0, 2070);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*css_observer*/ 4) {
    				attr_dev(div, "style", /*css_observer*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Saos", slots, ['default']);
    	let { animation = "none" } = $$props;
    	let { animation_out = "none; opacity: 0" } = $$props;
    	let { once = false } = $$props;
    	let { top = 0 } = $$props;
    	let { bottom = 0 } = $$props;
    	let { css_observer = "" } = $$props;
    	let { css_animation = "" } = $$props;

    	// cute litle reactive dispatch to get if is observing :3
    	const dispatch = createEventDispatcher();

    	// be aware... he's looking...
    	let observing = true;

    	// for some reason the 'bind:this={box}' on div stops working after npm run build... so... workaround time >:|
    	const countainer = `__saos-${Math.random()}__`;

    	/// current in experimental support, no support for IE (only Edge)
    	/// see more in: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
    	function intersection_verify(box) {
    		// bottom left top right
    		const rootMargin = `${-bottom}px 0px ${-top}px 0px`;

    		const observer = new IntersectionObserver(entries => {
    				$$invalidate(4, observing = entries[0].isIntersecting);

    				if (observing && once) {
    					observer.unobserve(box);
    				}
    			},
    		{ rootMargin });

    		observer.observe(box);
    		return () => observer.unobserve(box);
    	}

    	/// Fallback in case the browser not have the IntersectionObserver
    	function bounding_verify(box) {
    		const c = box.getBoundingClientRect();
    		$$invalidate(4, observing = c.top + top < window.innerHeight && c.bottom - bottom > 0);

    		if (observing && once) {
    			window.removeEventListener("scroll", verify);
    		}

    		window.addEventListener("scroll", bounding_verify);
    		return () => window.removeEventListener("scroll", bounding_verify);
    	}

    	onMount(() => {
    		// for some reason the 'bind:this={box}' on div stops working after npm run build... so... workaround time >:|
    		const box = document.getElementById(countainer);

    		if (IntersectionObserver) {
    			return intersection_verify(box);
    		} else {
    			return bounding_verify(box);
    		}
    	});

    	const writable_props = [
    		"animation",
    		"animation_out",
    		"once",
    		"top",
    		"bottom",
    		"css_observer",
    		"css_animation"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Saos> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("animation" in $$props) $$invalidate(0, animation = $$props.animation);
    		if ("animation_out" in $$props) $$invalidate(1, animation_out = $$props.animation_out);
    		if ("once" in $$props) $$invalidate(6, once = $$props.once);
    		if ("top" in $$props) $$invalidate(7, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(8, bottom = $$props.bottom);
    		if ("css_observer" in $$props) $$invalidate(2, css_observer = $$props.css_observer);
    		if ("css_animation" in $$props) $$invalidate(3, css_animation = $$props.css_animation);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		animation,
    		animation_out,
    		once,
    		top,
    		bottom,
    		css_observer,
    		css_animation,
    		dispatch,
    		observing,
    		countainer,
    		intersection_verify,
    		bounding_verify
    	});

    	$$self.$inject_state = $$props => {
    		if ("animation" in $$props) $$invalidate(0, animation = $$props.animation);
    		if ("animation_out" in $$props) $$invalidate(1, animation_out = $$props.animation_out);
    		if ("once" in $$props) $$invalidate(6, once = $$props.once);
    		if ("top" in $$props) $$invalidate(7, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(8, bottom = $$props.bottom);
    		if ("css_observer" in $$props) $$invalidate(2, css_observer = $$props.css_observer);
    		if ("css_animation" in $$props) $$invalidate(3, css_animation = $$props.css_animation);
    		if ("observing" in $$props) $$invalidate(4, observing = $$props.observing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*observing*/ 16) {
    			dispatch("update", { observing });
    		}
    	};

    	return [
    		animation,
    		animation_out,
    		css_observer,
    		css_animation,
    		observing,
    		countainer,
    		once,
    		top,
    		bottom,
    		$$scope,
    		slots
    	];
    }

    class Saos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			animation: 0,
    			animation_out: 1,
    			once: 6,
    			top: 7,
    			bottom: 8,
    			css_observer: 2,
    			css_animation: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Saos",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get animation() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animation_out() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation_out(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get once() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set once(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css_observer() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css_observer(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css_animation() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css_animation(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Footer\Footer.svelte generated by Svelte v3.38.2 */

    const file$1 = "src\\Components\\Footer\\Footer.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let p0;
    	let t3;
    	let div2;
    	let p1;
    	let t5;
    	let p2;
    	let i0;
    	let t6;
    	let t7;
    	let t8;
    	let p3;
    	let i1;
    	let t9;
    	let t10;
    	let t11;
    	let p4;
    	let i2;
    	let t12;
    	let t13;
    	let t14;
    	let div3;
    	let p5;
    	let t16;
    	let input;
    	let t17;
    	let button;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*header*/ ctx[0]);
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `${/*DESCRIPTION*/ ctx[1]}`;
    			t3 = space();
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = `${/*HEADING*/ ctx[4]}`;
    			t5 = space();
    			p2 = element("p");
    			i0 = element("i");
    			t6 = space();
    			t7 = text(/*ADDRESS*/ ctx[5]);
    			t8 = space();
    			p3 = element("p");
    			i1 = element("i");
    			t9 = space();
    			t10 = text(/*MOBILE*/ ctx[6]);
    			t11 = space();
    			p4 = element("p");
    			i2 = element("i");
    			t12 = space();
    			t13 = text(/*EMAIL*/ ctx[7]);
    			t14 = space();
    			div3 = element("div");
    			p5 = element("p");
    			p5.textContent = `${/*SUBSCRIBE_NEWSLETTER*/ ctx[2]}`;
    			t16 = space();
    			input = element("input");
    			t17 = space();
    			button = element("button");
    			button.textContent = `${/*SUBSCRIBE*/ ctx[3]}`;
    			attr_dev(div0, "class", "company_brand");
    			add_location(div0, file$1, 19, 8, 571);
    			add_location(p0, file$1, 20, 8, 622);
    			attr_dev(div1, "class", "col-md-4 footer-box");
    			add_location(div1, file$1, 18, 6, 528);
    			attr_dev(p1, "class", "footer-title svelte-1e6albd");
    			add_location(p1, file$1, 23, 8, 707);
    			attr_dev(i0, "class", "fas fa-map-marker-alt");
    			add_location(i0, file$1, 25, 10, 769);
    			add_location(p2, file$1, 24, 8, 754);
    			attr_dev(i1, "class", "fas fa-phone");
    			add_location(i1, file$1, 29, 10, 864);
    			add_location(p3, file$1, 28, 8, 849);
    			attr_dev(i2, "class", "fas fa-envelope");
    			add_location(i2, file$1, 33, 10, 949);
    			add_location(p4, file$1, 32, 8, 934);
    			attr_dev(div2, "class", "col-md-4 footer-box");
    			add_location(div2, file$1, 22, 6, 664);
    			attr_dev(p5, "class", "footer-title svelte-1e6albd");
    			add_location(p5, file$1, 38, 8, 1076);
    			attr_dev(input, "type", "email");
    			attr_dev(input, "class", "form-control round-border svelte-1e6albd");
    			attr_dev(input, "placeholder", "Your Email");
    			add_location(input, file$1, 39, 8, 1136);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-outline-light round-border svelte-1e6albd");
    			add_location(button, file$1, 43, 8, 1260);
    			attr_dev(div3, "class", "col-md-4 footer-box svelte-1e6albd");
    			add_location(div3, file$1, 37, 6, 1033);
    			attr_dev(div4, "class", "row section-body svelte-1e6albd");
    			add_location(div4, file$1, 17, 4, 490);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$1, 16, 2, 461);
    			attr_dev(section, "class", "main-bgcolor light-color");
    			attr_dev(section, "id", "footer");
    			add_location(section, file$1, 15, 0, 403);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, p0);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, p1);
    			append_dev(div2, t5);
    			append_dev(div2, p2);
    			append_dev(p2, i0);
    			append_dev(p2, t6);
    			append_dev(p2, t7);
    			append_dev(div2, t8);
    			append_dev(div2, p3);
    			append_dev(p3, i1);
    			append_dev(p3, t9);
    			append_dev(p3, t10);
    			append_dev(div2, t11);
    			append_dev(div2, p4);
    			append_dev(p4, i2);
    			append_dev(p4, t12);
    			append_dev(p4, t13);
    			append_dev(div4, t14);
    			append_dev(div4, div3);
    			append_dev(div3, p5);
    			append_dev(div3, t16);
    			append_dev(div3, input);
    			append_dev(div3, t17);
    			append_dev(div3, button);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 1) set_data_dev(t0, /*header*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	let { footerData = {} } = $$props;
    	let { header = "" } = $$props;
    	const { DESCRIPTION, CONTACT_DETAILS, SUBSCRIBE_NEWSLETTER, SUBSCRIBE } = footerData;
    	const { HEADING, ADDRESS, MOBILE, EMAIL } = CONTACT_DETAILS;
    	const writable_props = ["footerData", "header"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("footerData" in $$props) $$invalidate(8, footerData = $$props.footerData);
    		if ("header" in $$props) $$invalidate(0, header = $$props.header);
    	};

    	$$self.$capture_state = () => ({
    		footerData,
    		header,
    		DESCRIPTION,
    		CONTACT_DETAILS,
    		SUBSCRIBE_NEWSLETTER,
    		SUBSCRIBE,
    		HEADING,
    		ADDRESS,
    		MOBILE,
    		EMAIL
    	});

    	$$self.$inject_state = $$props => {
    		if ("footerData" in $$props) $$invalidate(8, footerData = $$props.footerData);
    		if ("header" in $$props) $$invalidate(0, header = $$props.header);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		header,
    		DESCRIPTION,
    		SUBSCRIBE_NEWSLETTER,
    		SUBSCRIBE,
    		HEADING,
    		ADDRESS,
    		MOBILE,
    		EMAIL,
    		footerData
    	];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { footerData: 8, header: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get footerData() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set footerData(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (141:0) <Saos animation={'scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both'}>
    function create_default_slot(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "alt", "logo");
    			if (img.src !== (img_src_value = "/image31.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "height", "200px");
    			add_location(img, file, 141, 0, 2774);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(141:0) <Saos animation={'scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both'}>",
    		ctx
    	});

    	return block;
    }

    // (150:1) {#if section.active}
    function create_if_block(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let p;
    	let t2_value = /*section*/ ctx[6].content + "";
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Foo";
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			add_location(h3, file, 151, 3, 3078);
    			add_location(p, file, 154, 3, 3103);
    			attr_dev(div, "class", "slider svelte-1fa41sa");
    			add_location(div, file, 150, 2, 3037);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*sections*/ 4) && t2_value !== (t2_value = /*section*/ ctx[6].content + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(150:1) {#if section.active}",
    		ctx
    	});

    	return block;
    }

    // (144:0) {#each sections as section}
    function create_each_block(ctx) {
    	let div;
    	let button;
    	let span;
    	let t0_value = /*section*/ ctx[6].title + "";
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*section*/ ctx[6]);
    	}

    	let if_block = /*section*/ ctx[6].active && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "svelte-1fa41sa");
    			add_location(span, file, 147, 8, 2968);
    			attr_dev(button, "class", "btn-slide-line svelte-1fa41sa");
    			add_location(button, file, 146, 6, 2893);
    			attr_dev(div, "class", "accordion svelte-1fa41sa");
    			add_location(div, file, 144, 0, 2862);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*sections*/ 4) && t0_value !== (t0_value = /*section*/ ctx[6].title + "")) set_data_dev(t0, t0_value);

    			if (/*section*/ ctx[6].active) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*sections*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(144:0) {#each sections as section}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let saos;
    	let t0;
    	let t1;
    	let footer;
    	let current;

    	saos = new Saos({
    			props: {
    				animation: "scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*sections*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	footer = new Footer({
    			props: {
    				footerData: /*FOOTER_DATA*/ ctx[1],
    				header: /*HEADER*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(saos.$$.fragment);
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(saos, target, anchor);
    			insert_dev(target, t0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const saos_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				saos_changes.$$scope = { dirty, ctx };
    			}

    			saos.$set(saos_changes);

    			if (dirty & /*sections, expand*/ 12) {
    				each_value = /*sections*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t1.parentNode, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const footer_changes = {};
    			if (dirty & /*FOOTER_DATA*/ 2) footer_changes.footerData = /*FOOTER_DATA*/ ctx[1];
    			if (dirty & /*HEADER*/ 1) footer_changes.header = /*HEADER*/ ctx[0];
    			footer.$set(footer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saos.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saos.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(saos, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { HEADER } = $$props;
    	let { FOOTER_DATA } = $$props;
    	let visible = true;

    	let sections = [
    		{
    			id: 1,
    			title: "Section 1",
    			content: "This is some test content",
    			active: false
    		},
    		{
    			id: 2,
    			title: "Section 2",
    			content: "Welcome to section 2 test content",
    			active: false
    		},
    		{
    			id: 3,
    			title: "Section 3",
    			content: "Looks like you have found what is hidden behind door number 3",
    			active: false
    		}
    	];

    	const expand = section => {
    		$$invalidate(2, sections = sections.map(s => {
    			s.active = false;

    			if (s.id === section.id) {
    				s.active = true;
    			}

    			return s;
    		}));
    	};

    	const writable_props = ["HEADER", "FOOTER_DATA"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = section => expand(section);

    	$$self.$$set = $$props => {
    		if ("HEADER" in $$props) $$invalidate(0, HEADER = $$props.HEADER);
    		if ("FOOTER_DATA" in $$props) $$invalidate(1, FOOTER_DATA = $$props.FOOTER_DATA);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		Saos,
    		Footer,
    		HEADER,
    		FOOTER_DATA,
    		visible,
    		sections,
    		expand
    	});

    	$$self.$inject_state = $$props => {
    		if ("HEADER" in $$props) $$invalidate(0, HEADER = $$props.HEADER);
    		if ("FOOTER_DATA" in $$props) $$invalidate(1, FOOTER_DATA = $$props.FOOTER_DATA);
    		if ("visible" in $$props) visible = $$props.visible;
    		if ("sections" in $$props) $$invalidate(2, sections = $$props.sections);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [HEADER, FOOTER_DATA, sections, expand, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { HEADER: 0, FOOTER_DATA: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*HEADER*/ ctx[0] === undefined && !("HEADER" in props)) {
    			console.warn("<App> was created without expected prop 'HEADER'");
    		}

    		if (/*FOOTER_DATA*/ ctx[1] === undefined && !("FOOTER_DATA" in props)) {
    			console.warn("<App> was created without expected prop 'FOOTER_DATA'");
    		}
    	}

    	get HEADER() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set HEADER(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get FOOTER_DATA() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set FOOTER_DATA(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world',
    		FOOTER_DATA: {
    			DESCRIPTION:
    			  "We are typically focused on result-based maketing in the digital world. Also, we evaluate your brand’s needs and develop a powerful strategy that maximizes profits.",
    			CONTACT_DETAILS: {
    			  HEADING: "Contact us",
    			  ADDRESS: "La trobe street docklands, Melbourne",
    			  MOBILE: "+1 61234567890",
    			  EMAIL: "nixalar@gmail.com"
    			},
    			SUBSCRIBE_NEWSLETTER: "Subscribe newsletter",
    			SUBSCRIBE: "Subscribe"
    		  },
    		  HEADER:  "Nixalar"
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
