import { Button } from '@shopify/polaris';

/**
 * Premium primary CTA – brand orange, smooth micro-interactions.
 * Uses CSS variables from premium-shopify.css
 */
export default function MagicButton(props) {
  return (
    <div
      className="magic-button-wrapper"
      style={{
        display: 'inline-block',
        width: props.fullWidth ? '100%' : 'auto',
      }}
    >
      <Button {...props} variant="primary">
        {props.children}
      </Button>
    </div>
  );
}
