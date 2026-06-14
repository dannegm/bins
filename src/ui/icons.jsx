export const IconWrapper = ({ children, size = '1.2em', viewBox = '0 0 256 256', ...props }) => (
    <svg
        height={size}
        width={size}
        viewBox={viewBox}
        fill='currentColor'
        aria-hidden='true'
        focusable='false'
        role='presentation'
        {...props}
    >
        {children}
    </svg>
);

export const Unsplash = props => (
    <IconWrapper viewBox='0 0 32 32' {...props}>
        <path d='M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z' />
    </IconWrapper>
);
