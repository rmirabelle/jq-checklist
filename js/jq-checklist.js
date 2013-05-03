/**
 * A plugin for converting lists of checkboxes into a checklist.
 * @author Robert Mirabelle
 * @see https://github.com/rmirabelle/jq-checklist
 */
(function ($) {

    $.checklist = $.checklist || {version: '1.0.0'};

    /**
     * Create the plugin
     */
    $.fn.checklist = function (options, callback) {

        /**
         * verify dependent plugins are loaded
         */
        if (!$.fn.metadata) {
            alert('jQuery checklist plugin requires jQuery metadata plugin.');
            return;
        }

        $.metadata.setType('class');

        var api = this.data('checklist');
        if (api) {
            if (typeof(callback) == 'function') {
                callback.call(this);
            }
            return api;
        }

        var defaults = {
            //the title to display in the header
            title: '',
            /**
             * The css prefix assigned to each of
             * the component parts of the checklist:
             * frame, header, search, body, summary, footer.
             * @example if set to 'checklist-' the css
             * for the components would be checklist-frame,
             * checklist-header, etc.
             */
            prefix: 'checklist-',
            //should we include the header & title?
            header: true,
            //should we include the search box to filter the results?
            search: true,
            //should we include the summary which displays totals?
            summary: true,
            //should we include the footer with select all and none controls?
            footer: true,
            //should the checkboxes be read-only?
            readonly: false,
            /**
             * Callback function to fire when an item is checked.
             * This function will be passed the number of checked
             * items.
             */
            on_check: null
        };

        var settings = $.extend(true, {}, defaults, options);

        this.each(function () {
            settings = $.extend(true, {}, settings, $(this).metadata());
            api = new Checklist($(this), settings);
            $(this).data('checklist', api);
        });

        if (typeof(callback) == 'function') {
            callback.call(this);
        }

        return api;
    };

    /**
     * The main class.
     */
    function Checklist(el, sett) {

        var element = el;
        var id = element.attr('id');
        var prefix = sett.prefix;

        /**
         * Construct the checklist
         */
        create_line_items();

        var frame = build_frame();
        var header = sett.header ? build_header() : false;
        var search = sett.search ? build_search() : false;
        var summary = sett.summary && !sett.readonly ? build_summary() : false;
        var footer = sett.footer && !sett.readonly ? build_footer() : false;
        var component = null;

        /**
         * Now that we've built the component parts, assemble them
         */
        element.wrap(frame).after(footer).after(summary).before(header).before(search);

        /**
         * Run the checkreplace plugin on the original element
         * to replace the checkboxes
         */
        element.checkreplace({oncheck: check_replace_oncheck, readonly: sett.readonly});

        /**
         * Now that we've performed the check replacement,
         * update the summary to display the count of checked checkboxes
         */
        update_summary(element.data('checkreplace').get_checked_count());

        component = element.parent();

        /**
         * Call the ItemFilter plugin on the newly created list
         */
        component.itemfilter({search: 'input', items: 'li', filter_on: 'label'});

        /**
         * API/public methods.
         * @example - access the API manually
         * var api = $('selector').data('checklist');
         * api.do_something(), etc.
         * @example - API is returned by all event handlers
         * $('#my_element').checklist({on_whatever:my_handler});
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
             * Return the jQuery list of checked checkboxes
             */
            get_checked: function () {
                component.data('itemfilter').clear_search();
                return element.find('input:checked');
            },

            /**
             * Return the number of checked items
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
             * bubble the checked items to the top
             * of the list.
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
         * <input type="checkbox" name="users[]" id="23" class="{label:'Robert Smith', tip:'A nice guy'}"/>
         * This method parses the checkbox, creates a new label to place before it
         * wraps the label and checkbox in an li and wraps the li's in a ul
         */
        function create_line_items() {

            element.find(':checkbox').each(function () {

                $(this).addClass('checkreplace');

                //noinspection JSUnresolvedVariable
				var cb_value = $(this).attr('value'),
					meta = $(this).metadata(),
					cb_meta_label = meta.label || cb_value,
					cb_meta_tip = meta.tip || false,
					cb_meta_title = meta.title || false,
					label = $('<label>').html(cb_meta_label),
					li = $('<li>');

                if (cb_meta_title) li.attr('title', cb_meta_title);

                $(this).wrap(li).before(label);

                if (cb_meta_tip) {
                    var tip = build_tip(cb_meta_tip);
                    label.append(tip);
                }
            });

            $('li', element).wrapAll($('<ul>'));
            element.addClass(prefix + 'body');
        }

        /**
         * Respond to the checkreplace plugin's oncheck
         * callback. The checkreplace API is received.
         */
        function check_replace_oncheck(api) {
            var num = api.get_checked_count();
            /**
             * If the user added the on_check listener,
             * fire it and pass the number of checked items
             */
            if(typeof sett.on_check == 'function') {
                sett.on_check.call(api, num);
            }
            update_summary(num);
        }

        function update_summary(checked_count) {
            element.parent().find('.' + prefix + 'summary').html(checked_count + ' selected');
        }

        function build_tip(str) {
            return '<a href="#" class="tip" title="' + str + '"></a>';
        }

        function build_frame() {
            var frame = $('<div>');
            frame.attr('id', id + '-frame');
            frame.addClass(prefix + 'frame');
            return frame;
        }

        function build_header() {
            var header = $('<div>');
            header.addClass(prefix + 'header');
            header.html(sett.title);
            return header;
        }

        function build_search() {
            var s = $('<div><input type="text">');
            s.addClass(prefix + 'search');
            return s;
        }

        function build_summary() {
            var summary = $('<div>');
            summary.addClass(prefix + 'summary');
            summary.html('0 selected');
            return summary;
        }

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

    /**
     * @author Robert Mirabelle
     * This plugin offers simple checkbox replacement.
     * To wire it up, give each checkbox you want to replace
     * a CSS class of 'checkreplace' (configurable).
     * Then add a label immediately preceding the checkbox.
     * The checkbox will be hidden and you interact with the
     * label instead. The checkbox and label should be wrapped
     * by the element used as the selector for this plugin.
     *
     * @example
     * $('form').checkreplace();
     * @example
     * $('.selector').checkreplace({readonly:true});
     *
     * @example HTML:
     * <label>Check this box!</label>
     * <input class="checkreplace" type="checkbox" name="users[]" value="42"/>
     *
     * When the label is clicked, its class will be toggled
     * and the underlying checkbox will be checked
     */

    $.fn.checkreplace = function (options) {

        var checkreplace = this.data('checkreplace');
        if (checkreplace) return checkreplace;

        var defaults = {
            //the css class to assign to the checkbox to make it replacable
            checkclass: 'checkreplace',
            //the css assigned to checked boxes
            onclass: 'check',
            //the css class assigned to unchecked boxes
            offclass: 'uncheck',
            //the css class assigned to the container when no checkboxes are checked
            noneclass: 'nonechecked',
            //when true, checkboxes can't be clicked
            readonly: false,
            /**
             * Callback function for check events. You can define your
             * own handler here. Your handler will receive the API as
             * its only argument.
             */
            oncheck: function () {}
        };

        var settings = $.extend(true, {}, defaults, options);

        this.each(function () {
            checkreplace = new CheckReplace($(this), settings);
            $(this).data("checkreplace", checkreplace);
        });

        return checkreplace;
    };

    function CheckReplace(element, settings) {

        var list = $(element);
        var labels = list.find('label');
        var checked_count = 0;

        if (settings.readonly) {
            list.addClass('readonly');
        }

        /**
         * API/public methods.
         * @example - access the API manually
         * var api = $('selector').data('checkreplace');
         * api.do_something(), etc.
         * @example - API is returned by all event handlers
         * $('#my_element').checklist({oncheck:my_handler});
         * function my_handler(api) {
		 * 	alert(api.get_checked_count());
		 * }
         */
        $.extend(this, {

            /**
             * Check all the checkboxes
             * @param visible_only - don't check hidden checkboxes
             */
            check_all: function (visible_only) {
                if (typeof(visible_only == 'undefined')) {
                    visible_only = true;
                }
                checked_count = 0;
                var should_check = true;
                labels.each(function () {
                    if (visible_only) {
                        should_check = $(this).is(':visible');
                    }
                    if (should_check) {
                        checked_count++;
                        $(this).removeClass(settings.offclass).addClass(settings.onclass);
                        $(this).next(':checkbox').attr('checked', true);
                    }
                });
                check_checked_count();
                oncheck(this);
            },

            check_none: function () {
                checked_count = 0;
                labels.each(function () {
                    $(this).removeClass(settings.onclass).addClass(settings.offclass);
                    $(this).next(':checkbox').attr('checked', false);
                });
                check_checked_count();
                oncheck(this);
            },

            rewire: function () {
                wire();
            },

            /**
             * For each value received in the array,
             * Find the matching checkbox value and
             * check the checkbox
             */
            set_checked: function (arr) {
                checked_count = 0;
                var cb;
                labels.each(function () {
                    cb = $(this).next(':checkbox');
                    $(this).removeClass(settings.onclass).addClass(settings.offclass);
                    cb.attr('checked', false);
                    var len = arr.length;
                    for (var x = 0; x < len; x++) {
                        if (cb.val() == arr[x]) {
                            checked_count++;
                            $(this).removeClass(settings.offclass).addClass(settings.onclass);
                            $(this).next(':checkbox').attr('checked', true);
                        }
                    }
                });
                check_checked_count();
                oncheck(this);
            },

            get_checked_count: function () {
                return checked_count;
            }
        });

        function wire() {
            labels.each(function () {

                var label = $(this);
                var check = label.next(':checkbox');

                //if the label has a targeted checkbox, replace it!
                if (check.length > 0 && check.hasClass(settings.checkclass)) {

                    check.hide();

                    //set initial state of the label
                    if (check.is(':checked')) {
                        checked_count++;
                        label.removeClass(settings.offclass).addClass(settings.onclass);
                    } else {
                        label.removeClass(settings.onclass).addClass(settings.offclass);
                    }

                    if (!settings.readonly) {
                        //wire up the click event on the label
                        label.click(function (e) {
                            e.preventDefault();
                            toggle_checkbox(check);
                            toggle_label(label);
                            check_checked_count();
                            oncheck(this);
                        });
                    }
                }
            });
        }

        wire();

        check_checked_count();

        /**
         * Fire the oncheck event as defined in settings.
         * All events pass the api as their primary argument.
         * @param target The triggering element
         */
        function oncheck(target) {
            settings.oncheck.call(target, element.data('checkreplace'));
        }

        /**
         * If no checkboxes are checked,
         * add the 'noneclass' to the checklist. You can create
         * a style for this class to indicate that nothing is checked.
         */
        function check_checked_count() {
            if (checked_count > 0) {
                list.removeClass(settings.noneclass);
            } else {
                list.addClass(settings.noneclass);
            }
        }

        function toggle_checkbox(check) {
            if (check.is(':checked')) {
                check.attr('checked', false);
            } else {
                check.attr('checked', true);
            }
            if (check.is(':checked')) {
                checked_count++;
            } else {
                checked_count--;
            }
        }

        function toggle_label(label) {
            if (label.hasClass(settings.onclass)) {
                label.removeClass(settings.onclass).addClass(settings.offclass);
            } else {
                label.removeClass(settings.offclass).addClass(settings.onclass);
            }
        }
    }

    /**
     * @author Robert Mirabelle
     *
     * This plugin allows you to filter (show/hide) selected items in almost
     * any type of list via a search box.
     *
     * As you type into the search box, matching items are shown and non-matching
     * items are hidden.
     *
     * The list of items is most often either options from a select list
     * or line items from an ordered or unordered list, but with a little
     * creativity, can be extended to include almost any repeating element.
     *
     * Configuration Options:
     * [search] - the jQuery selector for the text input used to perform the search
     * [items] - the jQuery selector for the repeating elements (i.e. 'option', 'li')
     * [filter_on] - jQuery function for the value we want to filter on
     *
     * Valid values for [filter_on] include:
     * 'text' - filter on the text of the repeating element
     * 'value' - filter on the value attribute of the repeating element
     * 'label' - filter on the first label inside the repeating element
     *
     * @example
     * <div id="filtered">
     * <input type="text"/>
     * <select>
     *    <option value="Johnson">Bill Johnson</option>
     *    <option value="Jones">Mark Jones</option>
     * </select>
     * </div>
     * $('#filtered').itemfilter({filter_on:'value'});
     *
     * @example
     * <input type="text"/>
     * <ul>
     *    <li>Bill</li>
     *    <li>Mark</li>
     * </ul>
     * $('ul').itemfilter({items:'li'});
     *
     * @example
     * In this example, we do a little hacking and add
     * a data attribute to each non-header row.
     * Standard elements such as tr and li do not reliably
     * support the 'value' attribute, but 'data' is good.
     *
     * <div id="mydiv">
     * <input type="text" id="search"/>
     * <table id="mytable">
     *    <tr>
     *        <th>Last Name</th>
     *        <th>First Name</th>
     *    </tr>
     *    <tr class="filterable" data="Johnson">
     *        <td>Johnson</td>
     *        <td>Bill</td>
     *    </tr>
     *    <tr class="filterable" data="Jones">
     *        <td>Jones</td>
     *        <td>Mark</td>
     *    </tr>
     * </table>
     * </div>
     * $('#mydiv').itemfilter({items:'.filterable', filter_on:'data'});
     */

    $.fn.itemfilter = function (options) {

        var filter = this.data('itemfilter');
        if (filter) return filter;

        var defaults = {
            //selector for the list items
            items: 'option',
            //what property contains the value to search against
            filter_on: 'text',
            //selector for the search text
            search_box: 'input:text',
            //the color of the search text when not active
            css_off: '#999',
            //the color of the search text when active
            css_on: '#000'
        };

        var settings = $.extend(true, {}, defaults, options);

        this.each(function () {
            filter = new ItemFilter(settings);
            filter.init($(this));
            $(this).data('itemfilter', filter);
        });

        return filter;
    };

    function ItemFilter(conf) {

        var element = null;
        var settings = conf;
        var items = [];
        var regex = new RegExp();
        var matches = [];
        var val = '';
        var pattern = '';
        var container = '';

        $.extend(this, {
            //find the items to filter
            init: function (el) {
                element = el;
                items = element.find(settings.items);
                container = items.parent();
                build_search();
            },
            clear_search: function () {
                element.find(settings.search_box).val('');
                search("");
            }
        });

        function build_search() {
            var search_box = element.find(settings.search_box);
            if (!search_box.length) {
                return;
            }
            search_box.css({color: settings.css_off}).val('search');
            search_box.click(function () {
                $(this).css({color: settings.css_on}).val('');
            });
            search_box.blur(function () {
                if ($(this).val() == '') {
                    $(this).css({color: settings.css_off}).val('search');
                }
            });
            search_box.live('keyup', function (e) {
                //don't count the SHIFT key as a key press
                if (e.which == 16) return;
                search($(this).val());
            });
        }

        /**
         * Rebuild the list by detaching all items
         * from the DOM and then re-attaching them
         * from the array of matched items.
         * You cannot simply hide() the elements as
         * expected because webkit doesn't support
         * this properly.
         * @param arr
         */
        function build_list(arr) {
            items.each(function () {
                $(this).detach();
            });
            var len = arr.length;
            for (var x = 0; x < len; x++) {
                container.append(arr[x]);
            }
        }

        /**
         * Get the effective value for the line item so we
         * can show or hide it based on the search. The value
         * depends on the value for settings.filter_on.
         * @param item jQuery object
         * @returns string
         */
        function get_value(item) {
            switch (settings.filter_on) {
            /**
             * If filtering on value, we look for
             * the item's value attribute
             */
                case 'value':
                    val = $(item).attr('value');
                    break;
            /**
             * If filtering on text, we look for
             * the item's content
             */
                case 'text':
                    val = $(item).text();
                    break;
            /**
             * if filtering on labels, we look for the
             * item's first label and return its text
             */
                case 'label':
                    val = $(item).find('label:first').text();
                    break;
                default:
                    throw('Cannot filter on ' + settings.filter_on);

            }
            return val;
        }

        /**
         * Search the items for the string.
         * Create an array of items that match.
         * Trigger rebuilding the item list.
         * @param str The search value
         */
        function search(str) {
            if (str.length == 0) {
                build_list(items);
            } else {
                str = str.split('\\').join('\\\\');
                matches.length = 0;
                pattern = "^" + str;
                regex = new RegExp(pattern, 'i');
                var len = items.length;
                for (var x = 0; x < len; x++) {
                    val = get_value(items[x]);
                    if (val.match(regex)) {
                        matches.push(items[x]);
                    }
                }
                build_list(matches);
            }
        }
    }
})(jQuery);