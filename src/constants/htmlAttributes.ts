// Common HTML attributes
export const GLOBAL_ATTRIBUTES = [
    { name: 'class', description: 'CSS class name(s)' },
    { name: 'id', description: 'Unique identifier' },
    { name: 'style', description: 'Inline CSS styles' },
    { name: 'title', description: 'Advisory information' },
    { name: 'data-', description: 'Custom data attribute' },
    { name: 'hidden', description: 'Hide element' },
    { name: 'tabindex', description: 'Tab order' },
    { name: 'contenteditable', description: 'Editable content' },
    { name: 'draggable', description: 'Draggable element' },
    { name: 'lang', description: 'Language code' },
    { name: 'dir', description: 'Text direction' },
];

export const EVENT_ATTRIBUTES = [
    { name: 'onclick', description: 'Click event handler' },
    { name: 'ondblclick', description: 'Double click event' },
    { name: 'onmousedown', description: 'Mouse button down' },
    { name: 'onmouseup', description: 'Mouse button up' },
    { name: 'onmouseover', description: 'Mouse over element' },
    { name: 'onmouseout', description: 'Mouse out of element' },
    { name: 'onmousemove', description: 'Mouse move over element' },
    { name: 'onkeydown', description: 'Key down' },
    { name: 'onkeyup', description: 'Key up' },
    { name: 'onkeypress', description: 'Key press' },
    { name: 'onfocus', description: 'Element gains focus' },
    { name: 'onblur', description: 'Element loses focus' },
    { name: 'onchange', description: 'Value changes' },
    { name: 'onsubmit', description: 'Form submission' },
    { name: 'onload', description: 'Page/image loads' },
    { name: 'onerror', description: 'Error occurs' },
];

export const TAG_SPECIFIC_ATTRIBUTES: { [key: string]: Array<{ name: string, description: string }> } = {
    'a': [
        { name: 'href', description: 'Link destination URL' },
        { name: 'target', description: 'Where to open link (_blank, _self, etc.)' },
        { name: 'rel', description: 'Relationship to linked resource' },
        { name: 'download', description: 'Download link as file' },
    ],
    'img': [
        { name: 'src', description: 'Image source URL' },
        { name: 'alt', description: 'Alternative text' },
        { name: 'width', description: 'Image width' },
        { name: 'height', description: 'Image height' },
        { name: 'loading', description: 'Lazy loading (lazy, eager)' },
    ],
    'input': [
        { name: 'type', description: 'Input type (text, password, email, etc.)' },
        { name: 'name', description: 'Input name for form submission' },
        { name: 'value', description: 'Input value' },
        { name: 'placeholder', description: 'Placeholder text' },
        { name: 'required', description: 'Required field' },
        { name: 'disabled', description: 'Disabled input' },
        { name: 'readonly', description: 'Read-only input' },
        { name: 'maxlength', description: 'Maximum character length' },
        { name: 'min', description: 'Minimum value (for number/date)' },
        { name: 'max', description: 'Maximum value (for number/date)' },
        { name: 'pattern', description: 'Validation pattern (regex)' },
        { name: 'autocomplete', description: 'Autocomplete behavior' },
        { name: 'checked', description: 'Checked state (checkbox/radio)' },
    ],
    'textarea': [
        { name: 'name', description: 'Textarea name' },
        { name: 'rows', description: 'Number of visible rows' },
        { name: 'cols', description: 'Number of visible columns' },
        { name: 'placeholder', description: 'Placeholder text' },
        { name: 'required', description: 'Required field' },
        { name: 'disabled', description: 'Disabled textarea' },
        { name: 'readonly', description: 'Read-only textarea' },
        { name: 'maxlength', description: 'Maximum character length' },
    ],
    'button': [
        { name: 'type', description: 'Button type (button, submit, reset)' },
        { name: 'name', description: 'Button name' },
        { name: 'value', description: 'Button value' },
        { name: 'disabled', description: 'Disabled button' },
    ],
    'form': [
        { name: 'action', description: 'Form submission URL' },
        { name: 'method', description: 'HTTP method (GET, POST)' },
        { name: 'enctype', description: 'Form encoding type' },
        { name: 'target', description: 'Where to display response' },
        { name: 'autocomplete', description: 'Autocomplete behavior' },
        { name: 'novalidate', description: 'Disable validation' },
    ],
    'select': [
        { name: 'name', description: 'Select name' },
        { name: 'multiple', description: 'Allow multiple selections' },
        { name: 'size', description: 'Number of visible options' },
        { name: 'required', description: 'Required field' },
        { name: 'disabled', description: 'Disabled select' },
    ],
    'option': [
        { name: 'value', description: 'Option value' },
        { name: 'selected', description: 'Selected by default' },
        { name: 'disabled', description: 'Disabled option' },
    ],
    'label': [
        { name: 'for', description: 'Associated form element ID' },
    ],
    'link': [
        { name: 'rel', description: 'Relationship (stylesheet, icon, etc.)' },
        { name: 'href', description: 'Resource URL' },
        { name: 'type', description: 'MIME type' },
    ],
    'script': [
        { name: 'src', description: 'External script URL' },
        { name: 'type', description: 'Script MIME type' },
        { name: 'async', description: 'Asynchronous loading' },
        { name: 'defer', description: 'Deferred execution' },
    ],
    'style': [
        { name: 'type', description: 'MIME type (text/css)' },
    ],
    'meta': [
        { name: 'name', description: 'Metadata name' },
        { name: 'content', description: 'Metadata content' },
        { name: 'charset', description: 'Character encoding' },
        { name: 'http-equiv', description: 'HTTP header name' },
    ],
    'table': [
        { name: 'border', description: 'Table border width' },
        { name: 'cellpadding', description: 'Cell padding' },
        { name: 'cellspacing', description: 'Cell spacing' },
    ],
    'td': [
        { name: 'colspan', description: 'Number of columns to span' },
        { name: 'rowspan', description: 'Number of rows to span' },
    ],
    'th': [
        { name: 'colspan', description: 'Number of columns to span' },
        { name: 'rowspan', description: 'Number of rows to span' },
        { name: 'scope', description: 'Scope of header (row, col, etc.)' },
    ],
    'iframe': [
        { name: 'src', description: 'Frame source URL' },
        { name: 'width', description: 'Frame width' },
        { name: 'height', description: 'Frame height' },
        { name: 'frameborder', description: 'Frame border' },
        { name: 'allowfullscreen', description: 'Allow fullscreen' },
    ],
    'video': [
        { name: 'src', description: 'Video source URL' },
        { name: 'controls', description: 'Show video controls' },
        { name: 'autoplay', description: 'Auto-play video' },
        { name: 'loop', description: 'Loop video' },
        { name: 'muted', description: 'Muted by default' },
        { name: 'width', description: 'Video width' },
        { name: 'height', description: 'Video height' },
    ],
    'audio': [
        { name: 'src', description: 'Audio source URL' },
        { name: 'controls', description: 'Show audio controls' },
        { name: 'autoplay', description: 'Auto-play audio' },
        { name: 'loop', description: 'Loop audio' },
        { name: 'muted', description: 'Muted by default' },
    ],
};

// Get attributes for a specific tag
export function getAttributesForTag(tagName: string): Array<{ name: string, description: string }> {
    const specificAttrs = TAG_SPECIFIC_ATTRIBUTES[tagName.toLowerCase()] || [];
    return [...GLOBAL_ATTRIBUTES, ...EVENT_ATTRIBUTES, ...specificAttrs];
}