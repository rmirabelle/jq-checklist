(function ($) {
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
		if (checkreplace) {
			return checkreplace;
		}
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
				on_check: null
			},
			settings = $.extend(defaults, options);

		this.each(function () {
			checkreplace = new CheckReplace($(this), settings);
			$(this).data("checkreplace", checkreplace);
		});

		return checkreplace;
	};

	/**
	 * @param element {jQuery} wrapper for label and checkbox
	 * @param settings object
	 * @constructor
	 */
	function CheckReplace(element, settings) {
		var list = $(element),
			labels = list.find('label'),
			checked_count = 0;
		if (settings.readonly) {
			list.addClass('readonly');
		}

		wire();
		check_checked_count();

		/**
		 * API/public methods.
		 * @example - add handler at creation time
		 * $('#my_element').checklist({on_check:my_handler});
		 * function my_handler(api) { alert(api.get_checked_count());}
		 * @example - access the API manually later
		 * var api = $('selector').data('checkreplace');
		 * api.do_something(), etc.
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

			/**
			 * Uncheck all checkboxes
			 */
			check_none: function () {
				checked_count = 0;
				labels.each(function () {
					$(this).removeClass(settings.onclass).addClass(settings.offclass);
					$(this).next(':checkbox').attr('checked', false);
				});
				check_checked_count();
				oncheck(this);
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

			/**
			 * Return the number of checked checkboxes
			 * @returns {number}
			 */
			get_checked_count: function () {
				return checked_count;
			}
		});

		/**
		 * Perform the checkbox replacement
		 */
		function wire() {
			labels.each(function () {
				var label = $(this),
					check = label.next(':checkbox');
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
					//wire up the click event on the label
					if (!settings.readonly) {
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

		/**
		 * Fire the on_check event as defined in settings.
		 * All events pass the api as their primary argument.
		 * @param target The triggering element
		 */
		function oncheck(target) {
			settings.on_check.call(target, element.data('checkreplace'));
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

		/**
		 * Toggle the checked property of the checkbox
		 * @param check
		 */
		function toggle_checkbox(check) {
			if (check.is(':checked')) {
				check.prop('checked', false);
			} else {
				check.prop('checked', true);
			}
			if (check.is(':checked')) {
				checked_count++;
			} else {
				checked_count--;
			}
		}

		/**
		 * Toggle the css class of the checkbox label
		 * @param label
		 */
		function toggle_label(label) {
			if (label.hasClass(settings.onclass)) {
				label.removeClass(settings.onclass).addClass(settings.offclass);
			} else {
				label.removeClass(settings.offclass).addClass(settings.onclass);
			}
		}
	}
})(jQuery);