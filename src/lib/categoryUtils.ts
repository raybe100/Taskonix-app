import { DEFAULT_CATEGORIES, TaskCategory } from '../types';

/**
 * Get category information by ID
 */
export function getCategoryById(categoryId: string | undefined): TaskCategory | null {
  if (!categoryId) return null;
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId) || null;
}

/**
 * Get category display name with emoji
 */
export function getCategoryDisplay(categoryId: string | undefined): string {
  const category = getCategoryById(categoryId);
  if (!category) return '';
  return `${category.emoji} ${category.name}`;
}

/**
 * Get category color for styling
 */
export function getCategoryColor(categoryId: string | undefined): string {
  const category = getCategoryById(categoryId);
  return category?.color || '#8B7355'; // Default to primary color
}

/**
 * Get category badge classes
 */
export function getCategoryBadgeClasses(categoryId: string | undefined): string {
  const category = getCategoryById(categoryId);
  if (!category) return '';
  
  return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-opacity-20 border border-opacity-30 text-white`;
}

/**
 * Get category badge style
 */
export function getCategoryBadgeStyle(categoryId: string | undefined): React.CSSProperties {
  const category = getCategoryById(categoryId);
  if (!category) return {};
  
  return {
    backgroundColor: `${category.color}20`,
    borderColor: `${category.color}50`,
    color: category.color
  };
}