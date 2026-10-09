import { nextTick, ref } from 'vue';
import { Bold, Code2, Italic, List, ListOrdered, Quote, Strikethrough } from 'lucide-vue-next';
const props = defineProps();
const emit = defineEmits();
const textarea = ref(null);
const actions = [
    { label: 'Negrito', icon: Bold, mode: 'wrap', prefix: '*', suffix: '*' },
    { label: 'Itálico', icon: Italic, mode: 'wrap', prefix: '_', suffix: '_' },
    { label: 'Tachado', icon: Strikethrough, mode: 'wrap', prefix: '~', suffix: '~' },
    { label: 'Monoespaçado', icon: Code2, mode: 'wrap', prefix: '```', suffix: '```' },
    { label: 'Código em linha', icon: Code2, mode: 'wrap', prefix: '`', suffix: '`' },
    { label: 'Lista com marcadores', icon: List, mode: 'lines', prefix: '- ' },
    { label: 'Lista numerada', icon: ListOrdered, mode: 'lines', prefix: '', numbered: true },
    { label: 'Citação', icon: Quote, mode: 'lines', prefix: '> ' }
];
function applyAction(action) {
    const field = textarea.value;
    if (!field)
        return;
    const value = props.modelValue;
    const selectionStart = field.selectionStart;
    const selectionEnd = field.selectionEnd;
    if (action.mode === 'wrap') {
        const selected = value.slice(selectionStart, selectionEnd);
        const suffix = action.suffix ?? action.prefix;
        const formatted = `${value.slice(0, selectionStart)}${action.prefix}${selected}${suffix}${value.slice(selectionEnd)}`;
        emit('update:modelValue', formatted);
        void nextTick(() => {
            field.focus();
            const contentStart = selectionStart + action.prefix.length;
            field.setSelectionRange(contentStart, contentStart + selected.length);
        });
        return;
    }
    const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
    const nextLineBreak = value.indexOf('\n', selectionEnd);
    const lineEnd = nextLineBreak < 0 ? value.length : nextLineBreak;
    const block = value.slice(lineStart, lineEnd);
    const formatted = block.split('\n').map((line, index) => `${action.numbered ? `${index + 1}. ` : action.prefix}${line}`).join('\n');
    emit('update:modelValue', `${value.slice(0, lineStart)}${formatted}${value.slice(lineEnd)}`);
    void nextTick(() => {
        field.focus();
        field.setSelectionRange(lineStart, lineStart + formatted.length);
    });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-template-editor" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "message-template-label" },
    for: (__VLS_ctx.id),
});
(__VLS_ctx.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-format-toolbar" },
    role: "toolbar",
    'aria-label': (`Formatação: ${__VLS_ctx.label}`),
});
for (const [action] of __VLS_getVForSourceType((__VLS_ctx.actions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onMousedown: () => { } },
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.applyAction(action);
            } },
        key: (action.label),
        ...{ class: "message-format-button" },
        type: "button",
        title: (action.label),
        'aria-label': (action.label),
    });
    const __VLS_0 = ((action.icon));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        size: (15),
    }));
    const __VLS_2 = __VLS_1({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.emit('update:modelValue', $event.target.value);
        } },
    id: (__VLS_ctx.id),
    ref: "textarea",
    ...{ class: "message-template-textarea" },
    value: (__VLS_ctx.modelValue),
    maxlength: (__VLS_ctx.maxlength ?? 1000),
    rows: "3",
});
/** @type {typeof __VLS_ctx.textarea} */ ;
/** @type {__VLS_StyleScopedClasses['message-template-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['message-template-label']} */ ;
/** @type {__VLS_StyleScopedClasses['message-format-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['message-format-button']} */ ;
/** @type {__VLS_StyleScopedClasses['message-template-textarea']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            textarea: textarea,
            actions: actions,
            applyAction: applyAction,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
