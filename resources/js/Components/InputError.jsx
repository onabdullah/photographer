export default function InputError({ message, className = '', id = '', ...props }) {
    return message ? (
        <p
            {...props}
            id={id}
            className={'text-sm text-red-600 ' + className}
            role="alert"
        >
            {message}
        </p>
    ) : null;
}
