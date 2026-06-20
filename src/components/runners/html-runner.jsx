export const HtmlRunner = ({ content }) => (
    <iframe
        className='h-full w-full border-0'
        sandbox='allow-scripts allow-forms allow-modals'
        srcDoc={content ?? ''}
    />
);
