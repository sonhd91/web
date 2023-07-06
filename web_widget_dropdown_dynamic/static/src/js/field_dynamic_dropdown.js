/** @odoo-module */

import core from "web.core";
import {registry} from "@web/core/registry";
import {useInputField} from "@web/views/fields/input_field_hook";
import {standardFieldProps} from "@web/views/fields/standard_field_props";
import {Component} from "@odoo/owl";

var _lt = core._lt;

export class FieldDynamicDropdownChar extends Component {
    setup() {
        useInputField({
            getValue: () => this.props.value || false,
        });
        this._setValues();
    }
    get options() {
        var field_type = this.props.record.fields[this.props.name].type || "";
        if (["char", "integer", "selection"].includes(field_type)) {
            this._setValues();
            return this.props.record.fields[this.props.name].selection.filter(
                (option) => option[0] !== false && option[1] !== ""
            );
        } else {
            return [];
        }
    }
    get string() {
        switch (this.props.type) {
            case "many2one":
                return this.props.value ? this.props.value[1] : "";
            case "selection":
                return this.props.value !== false
                    ? this.options.find((o) => o[0] === this.props.value)[1]
                    : "";
            default:
                return "";
        }
    }
    get value() {
        const rawValue = this.props.value;
        return this.props.type === "many2one" && rawValue ? rawValue[0] : rawValue;
    }
    onMounted() {
        console.log("HISS");
    }
    parseInteger(value) {
        return parseInt(value);
    }
    onInput(ev) {
        let lastSetValue = null;
        var isDirty = ev.target.value !== lastSetValue;
        if (this.props.setDirty) {
            this.props.setDirty(isDirty);
        }
    }
    /**
     * @param {Event} ev
     */
    onChange(ev) {
        let lastSetValue = null;
        let isInvalid = false;
        var isDirty = ev.target.value !== lastSetValue;
        const field = this.props.record.fields[this.props.name];
        let value = JSON.parse(ev.target.value);
        if (isDirty) {
            if (value && field.type == "integer") {
                value = parseInt(value);
                if (!value) {
                    if (this.props.record) {
                        this.props.record.setInvalidField(this.props.name);
                    }
                    isInvalid = true;
                }
            }
            if (!isInvalid) {
                Promise.resolve(this.props.update(value));
                lastSetValue = ev.target.value;
            }
        }
        if (this.props.setDirty) {
            this.props.setDirty(isDirty);
        }
    }
    stringify(value) {

        return JSON.stringify(value);
    }

    // --------------------------------------------------------------------------
    // Public
    // --------------------------------------------------------------------------

    /**
     * @override
     * @returns {jQuery}
     */
    getFocusableElement() {
        return this.$el.is("select") ? this.$el : $();
    }
    /**
     * @override
     */
    isSet() {
        return this.value !== false;
    }
    /**
     * Listen to modifiers updates to hide/show the falsy value in the dropdown
     * according to the required modifier.
     *
     * @override
     */
    updateModifiersValue() {
        this._super.apply(this, arguments);
        if (!this.attrs.modifiersValue.invisible && this.mode !== "readonly") {
            this._setValues();
            this._renderEdit();
        }
    }

    // --------------------------------------------------------------------------
    // Private
    // --------------------------------------------------------------------------

    /**
     * @override
     * @private
     */
    _formatValue(value) {
        var options = _.extend(
            {},
            this.nodeOptions,
            {data: this.recordData},
            this.formatOptions
        );
        var formattedValue = _.find(this.values, function (option) {
            return option[0] === value;
        });
        if (!formattedValue) {
            return value;
        }
        formattedValue = formattedValue[1];
        if (options && options.escape) {
            formattedValue = _.escape(formattedValue);
        }
        return formattedValue;
    }
    /**
     * @override
     * @private
     */
    _renderEdit() {
        this.$el.empty();
        for (var i = 0; i < this.values.length; i++) {
            this.$el.append(
                $("<option/>", {
                    value: JSON.stringify(this.values[i][0]),
                    text: this.values[i][1],
                })
            );
        }
        this.$el.val(JSON.stringify(this.value));
    }
    /**
     * @override
     * @private
     */
    _renderReadonly() {
        this.$el.empty().text(this._formatValue(this.value));
    }
    /**
     * @override
     */
    _reset() {
        this._super.apply(this, arguments);
        this._setValues();
    }
    /**
     * Sets the possible field values.
     *
     * @private
     */
    _setValues() {
        if (this.props.record.preloadedData[this.props.name]) {
            var sel_value = this.props.record.preloadedData[this.props.name];
            // convert string element to integer if field is integer
            if (this.props.record.fields[this.props.name].type == "integer") {
                sel_value = sel_value.map((val_updated) => {
                    return val_updated.map((e) => {
                        if (typeof e === "string" && !isNaN(Number(e))) {
                            return Number(e);
                        }
                        return e;
                    });
                });
            }
            this.props.record.fields[this.props.name].selection = sel_value;
        }
    }

    // --------------------------------------------------------------------------
    // Handlers
    // --------------------------------------------------------------------------

    async save() {
        await this.props.save();
    }
}
FieldDynamicDropdownChar.description = _lt("Dynamic Dropdown");
FieldDynamicDropdownChar.template = "web.SelectionField";
FieldDynamicDropdownChar.legacySpecialData = "_fetchDynamicDropdownValues";
FieldDynamicDropdownChar.props = {
    ...standardFieldProps,
};
FieldDynamicDropdownChar.supportedTypes = ["char", "integer", "selection"];
registry.category("fields").add("dynamic_dropdown", FieldDynamicDropdownChar);
