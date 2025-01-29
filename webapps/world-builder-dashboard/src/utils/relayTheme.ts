import { RelayKitTheme } from '@reservoir0x/relay-kit-ui'

export const theme: RelayKitTheme = {
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  primaryColor: "#F04438",
  focusColor: "rgba(23, 92, 211, 0.70)",
  subtleBackgroundColor: "#171717",
  subtleBorderColor: "#393939",
  text: {
    default: "#FFFFFF",
    subtle: "#b9b9b9",
    error: "#F97066",
    success: "#12B76A",
  },
  buttons: {
    primary: {
      color: "#FFFFFF",
      background: "#F04438",
      hover: {
        color: "#FFFFFF",
        background: "#D92D20"
      }
    },
    secondary: {
      color: "#FFFFFF",
      background: "#0b0b0b",
      hover: {
        color: "#FFFFFF",
        background: "#4B5563"
      }
    },
    disabled: {
      color: "#FFFFFF70",
      background: "#F04438"
    }
  },
  input: {
    background: "#0b0b0b",
    borderRadius: "8px",
    color: "#FFFFFF"
  },
  skeleton: {
    background: "#393939"
  },
  dropdown: {
    background: "#0b0b0b",
    borderRadius: "8px"
  },
  widget: {
    background: "#0b0b0b",
    borderRadius: "12px",
    // border: "1px solid #27272A",
    card: {
      background: "#171717",
      borderRadius: "8px",
      border: "1px solid #393939",
      gutter: "20px"
    },
    selector: {
      background: "#171717",
      hover: {
        background: "#393939"
      }
    },
    swapCurrencyButtonBorderColor: '#393939',
    swapCurrencyButtonBorderWidth: '1px',
    swapCurrencyButtonBorderRadius: '8px',
  },
  modal: {
    background: "#171717",
    borderRadius: "12px"
  }
}