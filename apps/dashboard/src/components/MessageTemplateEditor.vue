<script setup lang="ts">
import { nextTick, ref, type Component } from 'vue';
import { Bold, Code2, Italic, List, ListOrdered, Quote, Strikethrough } from 'lucide-vue-next';

type FormattingAction = {
  label: string;
  icon: Component;
  mode: 'wrap' | 'lines';
  prefix: string;
  suffix?: string;
  numbered?: boolean;
};

const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  maxlength?: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const textarea = ref<HTMLTextAreaElement | null>(null);
const actions: FormattingAction[] = [
  { label: 'Negrito', icon: Bold, mode: 'wrap', prefix: '*', suffix: '*' },
  { label: 'Itálico', icon: Italic, mode: 'wrap', prefix: '_', suffix: '_' },
  { label: 'Tachado', icon: Strikethrough, mode: 'wrap', prefix: '~', suffix: '~' },
  { label: 'Monoespaçado', icon: Code2, mode: 'wrap', prefix: '```', suffix: '```' },
  { label: 'Código em linha', icon: Code2, mode: 'wrap', prefix: '`', suffix: '`' },
  { label: 'Lista com marcadores', icon: List, mode: 'lines', prefix: '- ' },
  { label: 'Lista numerada', icon: ListOrdered, mode: 'lines', prefix: '', numbered: true },
  { label: 'Citação', icon: Quote, mode: 'lines', prefix: '> ' }
];

function applyAction(action: FormattingAction): void {
  const field = textarea.value;
  if (!field) return;
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
</script>

<template>
  <div class="message-template-editor">
    <label class="message-template-label" :for="id">{{ label }}</label>
    <div class="message-format-toolbar" role="toolbar" :aria-label="`Formatação: ${label}`">
      <button v-for="action in actions" :key="action.label" class="message-format-button" type="button" :title="action.label" :aria-label="action.label" @mousedown.prevent @click="applyAction(action)">
        <component :is="action.icon" :size="15" />
      </button>
    </div>
    <textarea :id="id" ref="textarea" class="message-template-textarea" :value="modelValue" :maxlength="maxlength ?? 1000" rows="3" @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
  </div>
</template>