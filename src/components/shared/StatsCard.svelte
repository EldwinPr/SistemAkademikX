<script lang="ts">
	export let title: string;
	export let value: string | number;
	export let description: string = '';
	export let color: string = 'blue';
	export let actionText: string = '';
	export let actionHref: string = '';
	export let onActionClick: (() => void) | null = null;

	function handleAction() {
		if (onActionClick) {
			onActionClick();
		}
	}
</script>

<div class="overflow-hidden rounded-lg bg-{color}-50 p-5 shadow">
	<h4 class="text-lg font-medium text-{color}-900">{title}</h4>
	{#if description}
		<p class="mt-1 text-sm text-{color}-800">{description}</p>
	{/if}
	
	{#if value}
		<p class="mt-2 text-xl font-bold text-{color}-900">{value}</p>
	{/if}
	
	{#if actionText}
		<div class="mt-4">
			{#if actionHref}
				<a 
					href={actionHref} 
					class="font-semibold text-{color}-600 hover:text-{color}-800"
				>
					{actionText} &rarr;
				</a>
			{:else if onActionClick}
				<button 
					type="button"
					on:click={handleAction}
					class="font-semibold text-{color}-600 hover:text-{color}-800"
				>
					{actionText} &rarr;
				</button>
			{/if}
		</div>
	{/if}
</div>