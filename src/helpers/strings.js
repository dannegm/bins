export const trim = (str, trimStr = ' ') => {
    const escapedTrimStr = trimStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^(${escapedTrimStr})+|(${escapedTrimStr})+$`, 'g');
    return str.replace(regex, '');
};
