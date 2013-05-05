/**
 * A plugin for converting lists of checkboxes into a checklist.
 * @author Robert Mirabelle
 * @see https://github.com/rmirabelle/jq-checklist
 */
(function ($) {

    $.checklist = $.checklist || {version: '2.0.0'};

    /**
     * Create the plugin
     */
    $.fn.checklist = function (options, callback) {

		/** @var api Checklist **/
		var api = this.data('checklist');
		if (api) {
			if (typeof(callback) === 'function') {
				callback.call(this);
			}
			return api;
		}

		var defaults = {
				//text to show above checklist
				title: $(this).data('title'),
				//css prefix used on created elements
				prefix: 'checklist-',
				//should header be shown?
				header: true,
				//should search box be shown?
				search: true,
				//should totals summary be shown?
				summary: true,
				//should select all|none links be shown
				footer: true,
				//should checklist be readonly?
				readonly: false,
				/**
				 * Callback function to fire when item checked/unchecked.
				 * Receives number of checked items as its argument
				 */
				on_check: null
			},
			settings = $.extend(defaults, options);

		/**
		 * Do the plugin work on matched elements
		 */
        this.each(function () {
            api = new Checklist($(this), settings);
            $(this).data('checklist', api);
        });

        if (typeof callback === 'function') {
            callback.call(this);
        }
        return api;
    };

    /**
     * The main class.
     */
    function Checklist(el, sett) {

        var element = el,
			id = element.attr('id'),
			prefix = sett.prefix,
			frame = build_frame(),
			header = sett.header ? build_header() : false,
			search = sett.search ? build_search() : false,
			summary = sett.summary && !sett.readonly ? build_summary() : false,
			footer = sett.footer && !sett.readonly ? build_footer() : false,
			component = null;

		/**
         * Construct the checklist
         */
        create_line_items();

        /**
         * Now that we've built the component parts, assemble them
         */
        element.wrap(frame)
			.after(footer)
			.after(summary)
			.before(header)
			.before(search);

        /**
         * Run the checkreplace plugin on the original
		 * element to replace the checkboxes
         */
        element.checkreplace({
			on_check: check_replace_oncheck,
			readonly: sett.readonly
		});

        /**
         * Now that we've performed the check replacement, use the
		 * checkreplace API to update the summary to display the
		 * count of checked checkboxes
         */
        update_summary(element.data('checkreplace').get_checked_count());

		component = element.parent();
        /**
         * Call the itemfilter plugin on the newly created list
         */
        component.itemfilter({
			search: 'input',
			items: 'li',
			filter_on: 'label'
		});

        /**
         * API/public methods.
         * @example - access the API manually
         * var api = $('selector').data('checklist');
         * api.do_something(), etc.
         * @example - API is returned by all event handlers
         * $('#my_element').checklist({on_whatever: my_handler});
         * function my_handler(api) {
		 * 	api.do_something();
		 * }
         */
        $.extend(this, {
            /**
             * A 'bug' of sorts exists with this plugin.
             * You must manually clear any filter before
             * saving checked selections, otherwise, only
             * the visible checked selections will be saved.
             */
            clear_filter: function() {
                component.data('itemfilter').clear_search();
            },
			/**
			 * Get the jQuery collection of checkboxes
			 * @returns {*}
			 */
            get_checked: function () {
                component.data('itemfilter').clear_search();
                return element.find('input:checked');
            },

            /**
             * Return the number of checked items
			 * @returns number
             */
            get_num_checked: function() {
               return element.data('checkreplace').get_checked_count();
            },
            /**
             * For each of the values received,
             * if the value matches one of the checkbox
             * values, check the checkbox.
             */
            set_checked: function (arr_values) {
                element.data('checkreplace').set_checked(arr_values);
            },

            /**
             * Move the checked items to the top of the list.
             */
            bubble_checked: function() {
                var ul = $('ul', element),
                    all = ul.find('li').detach();
                all.each(function(){
                    var label = $('label', $(this));
                    if(label.hasClass('check')) {
                        $(this).appendTo(ul)
                    }
                });
                all.each(function(){
                    var label = $('label', $(this));
                    if(label.hasClass('uncheck')) {
                        $(this).appendTo(ul)
                    }
                });
            }
        });

        /**
         * Parse the existing checkbox completely. The checkbox format looks like this:
         * <input type="checkbox" name="users[]" id="23" data-label="Robert Smith" data-tip="A nice guy"/>
         * This method parses the checkbox, creates a new label to place before it
         * wraps the label and checkbox in an li and wraps the li's in a ul
         */
        function create_line_items() {

            element.find(':checkbox').each(function () {

                $(this).addClass('checkreplace');

                //noinspection JSUnresolvedVariable
				var cb_value = $(this).attr('value'),
					cb_label = $(this).data('label') || cb_value,
					cb_tip = $(this).data('tip') || false,
					cb_title = $(this).data('title') || false,
					label = $('<label>').html(cb_label),
					li = $('<li>');

                //todo this may be redundant with tip
				if (cb_title) li.attr('title', cb_title);

                $(this).wrap(li).before(label);

                if (cb_tip) {
                    var tip = build_tip(cb_tip);
                    label.append(tip);
                }
            });

            $('li', element).wrapAll($('<ul>'));
            element.addClass(prefix + 'body');
        }

        /**
         * Respond to the checkreplace plugin's on_check
         * callback. The checkreplace API is received.
         */
        function check_replace_oncheck(api) {
            var num = api.get_checked_count();
            /**
             * If on_check callback added to checklist
			 * bubble this event up to it and pass the
			 * number of checked items
             */
            if(typeof sett.on_check === 'function') {
                sett.on_check.call(api, num);
            }
            update_summary(num);
        }

		/**
		 * Update the summary with the number of checked items
		 * @param checked_count
		 */
        function update_summary(checked_count) {
            element.parent().find('.' + prefix + 'summary').html(checked_count + ' selected');
        }

		/**
		 * Build a tip from the string provided
		 * @param str
		 * @returns {*|HTMLElement}
		 */
        function build_tip(str) {
            return '<a href="#" class="tip" title="' + str + '"></a>';
        }

		/**
		 * @returns {*|HTMLElement}
		 */
        function build_frame() {
            var frame = $('<div>');
            frame.attr('id', id + '-frame');
            frame.addClass(prefix + 'frame');
            return frame;
        }

		/**
		 * @returns {*|HTMLElement}
		 */
        function build_header() {
            var header = $('<div>');
            header.addClass(prefix + 'header');
            header.html(sett.title);
            return header;
        }

		/**
		 * @returns {*|HTMLElement}
		 */
        function build_search() {
            var s = $('<div><input type="text">');
            s.addClass(prefix + 'search');
            return s;
        }

		/**
		 * @returns {*|HTMLElement}
		 */
        function build_summary() {
            var summary = $('<div>');
            summary.addClass(prefix + 'summary');
            summary.html('0 selected');
            return summary;
        }

		/**
		 * @returns {*|HTMLElement}
		 */
        function build_footer() {
            var footer = $('<div>Select <a href="#" class="all">All</a> | <a href="#" class="none">None</a>');
            footer.addClass(prefix + 'footer');
            $('.all', footer).click(function (e) {
                e.preventDefault();
                var api = element.data('checkreplace');
                api.check_all(false);
            });
            $('.none', footer).click(function (e) {
                e.preventDefault();
                var api = element.data('checkreplace');
                api.check_none();
            });
            return footer;
        }
    }
})(jQuery);