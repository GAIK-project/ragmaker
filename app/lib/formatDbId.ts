export const formatDbId = (input: string): string => {
    // Remove all characters except letters, numbers, spaces, and underscores
    let sanitized = input.replace(/[^a-zA-Z0-9 _]/g, "");
  
    // Replace spaces with underscores
    sanitized = sanitized.replace(/\s+/g, "_");
  
    // Capitalize the first letter
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};