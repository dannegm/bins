import { Component, useMemo } from 'react';

const STOP_CODES = [
    'YOUR_CODE_DID_THIS',
    'TABS_VS_SPACES_UNRESOLVED_CONFLICT',
    'TOO_MANY_COOKS_IN_THE_CRDT',
    'SEMICOLON_EMOTIONALLY_UNAVAILABLE',
    'UNDEFINED_IS_NOT_A_VIBE',
    'FORGOT_TO_CLOSE_A_TAG_SOMEWHERE',
    'RUBBER_DUCK_REFUSED_TO_HELP',
    'THE_CODE_WAS_FINE_YESTERDAY',
    'GIT_BLAME_POINTS_AT_YOU',
    'WORKS_ON_MY_MACHINE_EXCEPTION',
    'STACK_OVERFLOW_ANSWER_WAS_WRONG',
    'COPILOT_HALLUCINATED_THIS_FUNCTION',
    'DELETED_NODE_MODULES_AND_PRAYED',
    'MERGE_CONFLICT_IN_PRODUCTION',
    'TYPE_ERROR_IN_JAVASCRIPT_SHOCKING',
];

const NO_IDEA = [
    'nobody knows',
    'your guess is as good as ours',
    'somewhere in the void',
    'God knows',
    'a mystery for the ages',
    'ask the rubber duck',
    'the universe refuses to say',
    'somewhere between line 1 and infinity',
    'we have no idea and that terrifies us',
    'undefined (ironic)',
];

const BSODScreen = ({ error, errorInfo }) => {
    const stopCode = useMemo(() => STOP_CODES[Math.floor(Math.random() * STOP_CODES.length)], []);
    const faultingSymbol = useMemo(() => {
        const match = errorInfo?.componentStack?.match(/^\s*at (\S+)/m);
        return match?.[1] ?? NO_IDEA[Math.floor(Math.random() * NO_IDEA.length)];
    }, [errorInfo]);

    return (
        <div className='@container absolute inset-0 z-9999 overflow-y-auto px-8 pt-[20vh] pb-8 @sm:px-16 @sm:pb-16 font-mono bg-background text-foreground'>
            <div className='mx-auto w-full @sm:max-w-[75ch]'>
                <p className='mb-6 text-9xl font-thin font-sans'>:(</p>

                <p className='mb-4 text-3xl font-semibold leading-snug text-pretty'>
                    Bins ran into a problem and needs to reload.
                </p>

                <div className='mb-10 flex gap-6'>
                    <button
                        onClick={() => window.location.reload()}
                        className='cursor-pointer text-base underline opacity-70 hover:opacity-100 transition-opacity'
                        style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                    >
                        Press here to reload
                    </button>
                    <a
                        href={`https://github.com/dannegm/bins/issues/new?title=${encodeURIComponent(`[Bug] ${error?.message ?? 'Unexpected crash'}`)}&body=${encodeURIComponent(`## Description\n\n<!-- Describe what you were doing when this happened -->\n\n## Error\n\n\`\`\`\n${error?.message ?? ''}\n\`\`\`\n\n## Component stack\n\n\`\`\`\n${errorInfo?.componentStack ?? 'N/A'}\n\`\`\``)}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-base underline opacity-70 hover:opacity-100 transition-opacity'
                        style={{ color: 'inherit' }}
                    >
                        Report issue
                    </a>
                </div>

                <div className='mt-2 space-y-1 font-mono text-sm' style={{ opacity: 0.6 }}>
                    <p>Stop code: {stopCode}</p>
                    {error?.message && <p>Error: {error.message}</p>}
                    <p>What failed: {faultingSymbol}</p>
                </div>

                {errorInfo?.componentStack && (
                    <details className='mt-6'>
                        <summary
                            className='cursor-pointer font-mono text-sm hover:opacity-80'
                            style={{ opacity: 0.5 }}
                        >
                            Component stack
                        </summary>
                        <pre
                            className='mt-2 whitespace-pre-wrap break-all font-mono text-sm leading-relaxed'
                            style={{ opacity: 0.45 }}
                        >
                            {errorInfo.componentStack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.error) {
            return <BSODScreen error={this.state.error} errorInfo={this.state.errorInfo} />;
        }
        return this.props.children;
    }
}
