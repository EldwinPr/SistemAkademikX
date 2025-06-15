<script lang="ts">
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let color: 'indigo' | 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'white' = 'indigo';
	export let thickness: 'thin' | 'normal' | 'thick' = 'normal';
	
	// Size classes
	const sizeClasses = {
		xs: 'w-3 h-3',
		sm: 'w-4 h-4', 
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
		xl: 'w-12 h-12'
	};
	
	// Color classes
	const colorClasses = {
		indigo: 'border-indigo-600',
		blue: 'border-blue-600',
		green: 'border-green-600', 
		red: 'border-red-600',
		yellow: 'border-yellow-600',
		gray: 'border-gray-600',
		white: 'border-white'
	};
	
	// Thickness classes
	const thicknessClasses = {
		thin: 'border',
		normal: 'border-2',
		thick: 'border-4'
	};
</script>

<div 
	class="animate-spin rounded-full border-t-transparent inline-block
		   {sizeClasses[size]} 
		   {colorClasses[color]} 
		   {thicknessClasses[thickness]}"
	role="status"
	aria-label="Loading"
>
	<span class="sr-only">Loading...</span>
</div>