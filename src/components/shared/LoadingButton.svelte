<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte';
	
	export let loading = false;
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let loadingText = '';
	export let fullWidth = false;
	
	// Type definitions for spinner
	type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type SpinnerColor = 'indigo' | 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'white';
	
	// Base button classes
	const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
	
	// Size classes
	const sizeClasses: Record<typeof size, string> = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-2 text-sm', 
		lg: 'px-6 py-3 text-base'
	};
	
	// Variant classes
	const variantClasses: Record<typeof variant, string> = {
		primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-400',
		secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
		success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-400'
	};
	
	// Spinner colors for each variant
	const spinnerColors: Record<typeof variant, SpinnerColor> = {
		primary: 'white',
		secondary: 'white', 
		danger: 'white',
		success: 'white'
	};
	
	// Determine if button should be disabled
	$: isDisabled = disabled || loading;
	
	// Get spinner size based on button size
	let spinnerSize: SpinnerSize;
	$: spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs';
</script>

<button
	{type}
	disabled={isDisabled}
	class="{baseClasses} {sizeClasses[size]} {variantClasses[variant]} {fullWidth ? 'w-full' : ''}"
	on:click
>
	{#if loading}
		<LoadingSpinner 
			size={spinnerSize} 
			color={spinnerColors[variant]} 
		/>
		<span class="ml-2">
			{loadingText || 'Loading...'}
		</span>
	{:else}
		<slot />
	{/if}
</button>