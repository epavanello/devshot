<script lang="ts" module>
  import { cn, type WithElementRef } from '$lib/utils.js';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import type { Component, Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { type VariantProps, tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-[#7137ff]/30 disabled:pointer-events-none disabled:opacity-45',
    variants: {
      variant: {
        default: 'bg-[#18181b] text-white shadow-[5px_5px_0_#d8ff52] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#d8ff52]',
        accent: 'border-2 border-[#18181b] bg-[#d8ff52] text-[#18181b] shadow-[3px_3px_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5',
        outline: 'border border-[#d8d5cc] bg-white text-[#18181b] hover:border-[#18181b] hover:bg-[#f7f5ee]',
        ghost: 'bg-transparent text-[#18181b] hover:bg-[#ece9e1]'
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 px-6',
        icon: 'size-11 p-0',
        'icon-sm': 'size-9 rounded-lg p-0'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  });

  const iconSize = { default: 17, sm: 15, lg: 19, icon: 18, 'icon-sm': 16 } as const;
  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
  export type ButtonProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: Component<{ size?: number; class?: string }>;
    iconAtEnd?: boolean;
    loading?: boolean;
    loadingContent?: string | Snippet;
  };
</script>

<script lang="ts">
  let {
    class: className,
    variant = 'default',
    size = 'default',
    ref = $bindable(null),
    type = 'button',
    disabled: externalDisabled,
    children,
    onclick,
    icon,
    loading,
    loadingContent,
    iconAtEnd = false,
    ...restProps
  }: ButtonProps = $props();

  let internalLoading = $state(false);
  const isLoading = $derived(Boolean(loading || internalLoading));
  const disabled = $derived(Boolean(externalDisabled || isLoading));

  const handleClick: ButtonProps['onclick'] = (event) => {
    const result = onclick?.(event);
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      internalLoading = true;
      Promise.resolve(result).then(
        () => internalLoading = false,
        () => internalLoading = false
      );
    }
  };
</script>

{#snippet statusIcon()}
  {#if isLoading}
    <LoaderCircle size={iconSize[size]} class="animate-spin" />
  {:else if icon}
    {@const Icon = icon}
    <Icon size={iconSize[size]} class="pointer-events-none shrink-0" />
  {/if}
{/snippet}

<button
  bind:this={ref}
  data-slot="button"
  class={cn(buttonVariants({ variant, size }), className)}
  {type}
  {disabled}
  aria-busy={isLoading}
  onclick={handleClick}
  {...restProps}
>
  {#if iconAtEnd}
    {#if isLoading && loadingContent}
      {#if typeof loadingContent === 'string'}{loadingContent}{:else}{@render loadingContent()}{/if}
    {:else}{@render children?.()}{/if}
    {@render statusIcon()}
  {:else}
    {@render statusIcon()}
    {#if isLoading && loadingContent}
      {#if typeof loadingContent === 'string'}{loadingContent}{:else}{@render loadingContent()}{/if}
    {:else}{@render children?.()}{/if}
  {/if}
</button>
