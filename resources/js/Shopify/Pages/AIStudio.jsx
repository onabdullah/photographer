import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  DropZone,
  TextField,
  Select,
  Button,
  Thumbnail,
  Box,
  Icon,
  Tooltip,
  Modal,
  ChoiceList,
  Checkbox,
  RangeSlider,
} from '@shopify/polaris';
import {
  ArrowRightIcon,
  ExportIcon,
  ImageIcon,
  ImageMagicIcon,
  PlusCircleIcon,
} from '@shopify/polaris-icons';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import MagicButton from '@/Shopify/Components/MagicButton';
import BrowseFromStore from '@/Shopify/Components/BrowseFromStore';

const AI_TOOLS = [
  { value: 'remove_bg', label: 'Background Remover' },
  { value: 'bg_swap', label: 'Background Swap' },
  { value: 'upscale', label: 'Upscaler' },
  { value: 'magic_eraser', label: 'Magic Eraser' },
  { value: 'enhance', label: 'Image Enhancer' },
  { value: 'lighting', label: 'Lighting Fix' },
];

const BG_STYLES = [
  { value: 'studio', label: 'Studio White' },
  { value: 'marble', label: 'Marble' },
  { value: 'nature', label: 'Nature' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

const ASPECT_RATIOS = [
  { value: 'original', label: 'Original', ratio: '1/1' },
  { value: '1:1', label: '1:1', ratio: '1/1' },
  { value: '4:3', label: '4:3', ratio: '4/3' },
  { value: '16:9', label: '16:9', ratio: '16/9' },
  { value: '9:16', label: '9:16', ratio: '9/16' },
];

const VALID_TOOLS = ['remove_bg', 'bg_swap', 'upscale', 'magic_eraser', 'enhance', 'lighting'];

/** Gallery filter: value matches ImageGeneration.tool_used from API (e.g. background_remover) */
const GALLERY_TOOL_OPTIONS = [
  { value: 'all', label: 'All tools' },
  { value: 'background_remover', label: 'Background Remover' },
  { value: 'bg_swap', label: 'Background Swap' },
  { value: 'upscaler', label: 'Upscaler' },
  { value: 'magic_eraser', label: 'Magic Eraser' },
  { value: 'enhance', label: 'Image Enhancer' },
  { value: 'lighting', label: 'Lighting Fix' },
];

const UPSCALE_SCALE_OPTIONS = [
  { value: '2', label: '2×' },
  { value: '4', label: '4×' },
  { value: '8', label: '8×' },
];

const ENHANCE_VERSION_OPTIONS = [
  { value: 'v1.4', label: 'v1.4 (Recommended)' },
  { value: 'v1.3', label: 'v1.3' },
  { value: 'RestoreFormer', label: 'RestoreFormer' },
];

const ENHANCE_SCALE_OPTIONS = [
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
];

const LIGHTING_PRESETS = [
  { value: 'custom', label: 'Custom (type your own)' },
  { value: 'warm_studio_left', label: 'Warm Studio Light from Left', prompt: 'Professional studio setup: primary key light from camera left at 45 degrees, soft fill from the opposite side to open shadows. Warm color temperature (3200–4000K). Clean, editorial product or portrait quality with defined but flattering shadow.' },
  { value: 'warm_studio_right', label: 'Warm Studio Light from Right', prompt: 'Professional studio setup: primary key light from camera right at 45 degrees, soft fill to balance. Warm color temperature. Clean, editorial quality; subject shape and features preserved with natural dimension.' },
  { value: 'cinematic_dramatic', label: 'Cinematic Dramatic', prompt: 'Cinematic lighting: single strong key light with deep, controlled shadows. High contrast ratio. Moody, film-noir atmosphere. Preserve subject identity and proportions; only the lighting mood changes.' },
  { value: 'soft_morning', label: 'Soft Morning Sunlight', prompt: 'Soft morning daylight: large, diffused source (e.g. window) from one side. Warm, gentle shadows. Natural and flattering; no harsh highlights. As if shot in early morning interior or soft overcast.' },
  { value: 'neon_cyberpunk', label: 'Neon Cyberpunk Backlight', prompt: 'Neon-style backlight: colored lights (e.g. cyan, magenta) from behind the subject, creating a colored rim. Futuristic, editorial look. Subject remains sharp and recognizable; lighting is additive.' },
  { value: 'golden_hour', label: 'Golden Hour', prompt: 'Golden hour sunlight: warm, low-angle directional light. Long, soft shadows. Sunset/sunrise color temperature. Natural outdoor or simulated golden-hour feel; subject sharp and unchanged.' },
  { value: 'softbox_clean', label: 'Softbox Studio Clean', prompt: 'Large softbox as main source: even, wraparound soft light. Minimal shadow, ideal for e-commerce and clean product or portrait. Professional, neutral color; sharp detail and true-to-life rendering.' },
  { value: 'rim_light', label: 'Rim Light / Edge Light', prompt: 'Rim or edge lighting: key light from behind or side-back, creating a bright outline along the subject’s edges. Dramatic separation from background. Face and form preserved; only lighting direction and rim effect applied.' },
  { value: 'sunset_silhouette', label: 'Sunset Silhouette', prompt: 'Backlit sunset: warm orange and purple sky behind subject. Silhouette or semi-silhouette with subtle rim. Subject outline and proportions kept; lighting and sky set the mood.' },
  { value: 'moody_low_key', label: 'Moody Low Key', prompt: 'Low-key lighting: single key light, rest of frame in shadow. Deep blacks, moody atmosphere. Subject clearly defined; no change to face or shape, only to light distribution.' },
  { value: 'high_key_white', label: 'High Key White', prompt: 'High-key setup: soft, even wraparound light. Bright, minimal shadows. Clean white or near-white look. Ideal for beauty or product; sharp and flattering with no distortion.' },
  { value: 'split_light', label: 'Split Lighting', prompt: 'Split lighting: key light from one side so roughly half the subject is in light, half in shadow. Strong, dramatic. Classic portrait style; face and proportions unchanged.' },
  { value: 'loop_light', label: 'Loop Lighting', prompt: 'Loop lighting: key at 45 degrees, creating a small shadow from the nose toward the cheek. Classic, flattering portrait pattern. Professional and sharp; subject identity preserved.' },
  { value: 'rembrandt', label: 'Rembrandt Lighting', prompt: 'Rembrandt lighting: key light to create a small triangle of light on the shadow-side cheek. Classic, dramatic portrait. Subject shape and features unchanged; only lighting pattern applied.' },
  { value: 'butterfly', label: 'Butterfly Lighting', prompt: 'Butterfly lighting: key above and in front of subject, soft shadow under nose. Flattering, beauty-style. Even and sharp; no alteration to face or proportions.' },
  { value: 'broad_light', label: 'Broad Lighting', prompt: 'Broad lighting: main light on the side of the face turned toward camera. That side is brighter; classic portrait look. Sharp, professional; subject unchanged.' },
  { value: 'short_light', label: 'Short Lighting', prompt: 'Short lighting: main light on the side of the face turned away from camera. Slimming, dimensional. Professional portrait; face and proportions preserved.' },
  { value: 'backlight_silhouette', label: 'Backlight Silhouette', prompt: 'Strong backlight: subject in silhouette or near-silhouette with a bright rim. Subject outline and proportions clear; only lighting and exposure style change.' },
  { value: 'window_light_natural', label: 'Natural Window Light', prompt: 'Natural window light: soft, diffused daylight from one side. Gentle, flattering. No harsh contrast; sharp and natural with subject unchanged.' },
  { value: 'overhead_soft', label: 'Soft Overhead', prompt: 'Soft overhead source: even light from above. Minimal harsh shadows. Clean, professional; sharp detail and unchanged subject shape.' },
  { value: 'three_point_classic', label: 'Three-Point Classic', prompt: 'Classic three-point: key, fill, and back/hair light. Full dimension, professional studio look. Subject sharp and unchanged; only lighting is studio-style.' },
  { value: 'dramatic_single', label: 'Dramatic Single Source', prompt: 'Single hard key light: strong direction, defined shadows. Editorial or fashion style. Subject identity and proportions preserved; lighting is dramatic only.' },
  { value: 'soft_diffused', label: 'Soft Diffused', prompt: 'Heavily diffused soft light: wraparound, no harsh shadows. Beauty or product style. Even and sharp; face and shape preserved.' },
  { value: 'blue_hour', label: 'Blue Hour', prompt: 'Blue hour: cool, twilight ambient light. Subtle blue tone. Cinematic, natural; subject sharp and unchanged.' },
  { value: 'warm_tungsten', label: 'Warm Tungsten', prompt: 'Warm tungsten-style indoor light: cozy amber tone. As if lit by practical bulbs. Subject and quality preserved; only color temperature shifts.' },
  { value: 'cool_fluorescent', label: 'Cool Fluorescent', prompt: 'Cool fluorescent-style light: clean, modern. Retail or office feel. Neutral to cool; sharp and accurate, subject unchanged.' },
  { value: 'chocolate_gold', label: 'Chocolate & Gold', prompt: 'Warm chocolate and gold color palette in the lighting. Luxurious, premium product or portrait feel. Subject sharp; only color mood changes.' },
  { value: 'silver_platinum', label: 'Silver & Platinum', prompt: 'Cool silver and platinum tones in the light. Sleek, modern product or portrait. Sharp and clean; subject unchanged.' },
  { value: 'lifestyle_ambient', label: 'Lifestyle Ambient', prompt: 'Natural lifestyle ambient: as if in a real room or environment. Soft, authentic. Subject sharp and natural; no distortion.' },
  { value: 'editorial_fashion', label: 'Editorial Fashion', prompt: 'Editorial fashion lighting: bold, directional. Magazine-quality. Subject and proportions preserved; only lighting is editorial.' },
  { value: 'beauty_ring', label: 'Beauty Ring Light', prompt: 'Ring-style light: even, frontal. Soft catchlights in eyes, smooth skin rendering. Beauty standard; sharp and flattering, face unchanged.' },
  { value: 'product_white_seamless', label: 'White Seamless Product', prompt: 'White seamless product lighting: soft, even. Minimal shadow. Catalog quality; product or subject sharp and true to form.' },
  { value: 'product_dark_mood', label: 'Dark Mood Product', prompt: 'Dark mood product: single accent or key light. Premium, minimal. Subject sharp; only lighting mood is dark.' },
  { value: 'food_soft_warm', label: 'Food Soft & Warm', prompt: 'Soft, warm lighting for food: appetizing, gentle shadows. Natural color; sharp detail, no change to subject.' },
  { value: 'food_bright_fresh', label: 'Food Bright & Fresh', prompt: 'Bright, fresh lighting for food: high key, clean. Healthy, natural look. Sharp and accurate; subject unchanged.' },
  { value: 'jewelry_sparkle', label: 'Jewelry Sparkle', prompt: 'Lighting to enhance sparkle and reflection on jewelry. Controlled highlights. Subject and stones sharp; only light placement optimized.' },
  { value: 'cosmetic_clean', label: 'Cosmetic Clean', prompt: 'Clean, even lighting for cosmetics: true color, minimal shadow. Pack shot or beauty style. Sharp and accurate; no distortion.' },
  { value: 'bottles_glass', label: 'Bottles & Glass', prompt: 'Lighting for glass and bottles: subtle reflections, premium feel. Liquid and form clear. Sharp; subject unchanged.' },
  { value: 'textile_fabric', label: 'Textile & Fabric', prompt: 'Soft lighting to reveal fabric texture and color accurately. Even, flattering. Material sharp and true; no change to subject.' },
  { value: 'outdoor_overcast', label: 'Outdoor Overcast', prompt: 'Overcast daylight: soft, shadowless. Natural and even. As if outdoors on a cloudy day; subject sharp and unchanged.' },
  { value: 'outdoor_direct_sun', label: 'Outdoor Direct Sun', prompt: 'Direct sunlight: strong direction, clear shadows. Bold and vibrant. Subject sharp; only lighting is sunny.' },
  { value: 'open_shade', label: 'Open Shade', prompt: 'Open shade: soft directional light, no direct sun. Natural outdoor portrait feel. Sharp and flattering; subject preserved.' },
  { value: 'dappled_light', label: 'Dappled Light', prompt: 'Dappled light: pattern from leaves or blinds. Natural, organic. Subject sharp; only light pattern changes.' },
  { value: 'candlelight_warm', label: 'Candlelight Warm', prompt: 'Warm candlelight: intimate, orange glow. Low key. Subject sharp and recognizable; only color and mood shift.' },
  { value: 'fireplace_glow', label: 'Fireplace Glow', prompt: 'Warm glow as from a fireplace. Cozy ambient. Subject unchanged; only lighting mood applied.' },
  { value: 'neon_pink', label: 'Neon Pink Accent', prompt: 'Neon pink accent light: modern, editorial. Vibrant color. Subject sharp; only accent color added.' },
  { value: 'neon_blue', label: 'Neon Blue Accent', prompt: 'Neon blue accent light: cool, futuristic. Tech or editorial. Subject unchanged; only lighting color.' },
  { value: 'neon_green', label: 'Neon Green Accent', prompt: 'Neon green accent light: bold, sci-fi. Subject sharp; only accent color applied.' },
  { value: 'gradient_sunset', label: 'Gradient Sunset', prompt: 'Sunset gradient in scene: warm to cool, golden to blue. Subject sharp and unchanged; background and light mood only.' },
  { value: 'gradient_aurora', label: 'Aurora / Northern Lights', prompt: 'Aurora-style gradient: green and purple. Ethereal. Subject sharp; only ambient color and mood.' },
  { value: 'studio_flat', label: 'Studio Flat Lay', prompt: 'Flat lay lighting from above: even, shadowless. Top-down product or still life. Sharp and clean; subject unchanged.' },
  { value: 'dramatic_chiaroscuro', label: 'Chiaroscuro', prompt: 'Chiaroscuro: strong contrast between light and dark. Classical, painterly. Subject shape and face preserved; only light contrast.' },
  { value: 'mist_fog', label: 'Mist or Fog', prompt: 'Soft light through mist or fog: atmospheric, diffused. Subject still sharp and recognizable; only atmosphere added.' },
  { value: 'rain_window', label: 'Rain on Window', prompt: 'Light through rain on window: moody, bokeh droplets. Subject sharp; only environmental effect.' },
  { value: 'spotlight_stage', label: 'Spotlight Stage', prompt: 'Single spotlight from above: stage or gallery style. Subject clearly defined; only lighting style changes.' },
  { value: 'museum_display', label: 'Museum Display', prompt: 'Controlled display lighting: no glare, accurate color. As in a museum. Subject sharp and unchanged.' },
  { value: 'car_showroom', label: 'Car Showroom', prompt: 'Showroom-style lighting for reflective surfaces: multiple soft sources. Premium look. Subject sharp; only lighting setup.' },
  { value: 'architectural_clean', label: 'Architectural Clean', prompt: 'Clean architectural lighting: sharp lines, modern space. Subject or product sharp; only environment and light.' },
  { value: 'vintage_film', label: 'Vintage Film', prompt: 'Vintage film look: slightly warm, soft contrast. Nostalgic. Subject sharp; only color and contrast style.' },
  { value: 'minimalist_single', label: 'Minimalist Single', prompt: 'Minimalist single light source: clean, simple. One direction. Subject sharp and unchanged.' },
  { value: 'luxury_glossy', label: 'Luxury Glossy', prompt: 'Luxury glossy style: polished, premium reflections. Magazine finish. Subject sharp; only lighting quality and sheen.' },
];

const GALLERY_DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
];

const TEAL = '#468A9A';
const ORANGE = '#FF7A30';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const s = Math.floor((now - date) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

/** Custom teal-accented SVG for empty state (sparkle / canvas) */
function MasterpieceIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="48" stroke={TEAL} strokeWidth="2" strokeOpacity="0.4" fill="none" />
      <circle cx="60" cy="60" r="32" stroke={TEAL} strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
      <path
        d="M60 28v4M60 88v4M28 60h4M88 60h4M42 42l2.8 2.8M75.2 75.2l2.8 2.8M75.2 42l-2.8 2.8M42 75.2l-2.8 2.8"
        stroke={TEAL}
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <circle cx="60" cy="60" r="8" fill={TEAL} fillOpacity="0.25" />
      <circle cx="60" cy="60" r="4" fill={TEAL} fillOpacity="0.5" />
    </svg>
  );
}

export default function AIStudio({ product, initialImage, initialTool }) {
  const validInitialTool = initialTool && VALID_TOOLS.includes(initialTool) ? initialTool : 'remove_bg';
  const [inputImage, setInputImage] = useState(initialImage || null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedGeneratedIndex, setSelectedGeneratedIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState(validInitialTool);
  const [selectedStyle, setSelectedStyle] = useState('studio');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [generationId, setGenerationId] = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [gridColumns, setGridColumns] = useState(4);
  const [galleryToolFilter, setGalleryToolFilter] = useState('all');
  const [galleryDateFilter, setGalleryDateFilter] = useState('all');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [lastCompletedTool, setLastCompletedTool] = useState(null); // 'remove_bg' | 'upscale' | 'magic_eraser' | 'enhance' | 'lighting'
  const [lightingPreset, setLightingPreset] = useState('custom');
  const [lightingPromptText, setLightingPromptText] = useState('');
  const [upscaleScale, setUpscaleScale] = useState('4');
  const [upscaleFaceEnhance, setUpscaleFaceEnhance] = useState(false);
  const [enhanceVersion, setEnhanceVersion] = useState('v1.4');
  const [enhanceScale, setEnhanceScale] = useState('2');
  const [magicEraserBrushSize, setMagicEraserBrushSize] = useState(40); // 10–100 px
  const [magicEraserHasStrokes, setMagicEraserHasStrokes] = useState(false);
  const [magicEraserCursorPos, setMagicEraserCursorPos] = useState({ x: -100, y: -100 });
  const [magicEraserCursorVisible, setMagicEraserCursorVisible] = useState(false);
  const [compareSliderPosition, setCompareSliderPosition] = useState(50); // 0-100 for before/after
  const [exportType, setExportType] = useState('flat'); // 'flat', 'categories', 'specific_tool'
  const [exportSpecificTool, setExportSpecificTool] = useState('background_remover');
  const [isExporting, setIsExporting] = useState(false);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const fileInputRef = useRef(null);
  const magicEraserCanvasRef = useRef(null);
  const magicEraserWrapRef = useRef(null);
  const magicEraserImageRef = useRef(null);
  const magicEraserCursorRef = useRef(null);
  const magicEraserBrushSizeRef = useRef(magicEraserBrushSize);
  magicEraserBrushSizeRef.current = magicEraserBrushSize;
  const shopifyAppBridge = (typeof window !== 'undefined' && window.shopify) || null;

  const refetchRecentGenerations = useCallback(() => {
    axios.get('/shopify/recent-generations').then((res) => {
      if (res.data?.generations) setRecentGenerations(res.data.generations);
    }).catch(() => { });
  }, []);

  const hasValidInput = inputImage && !inputImage.includes('placeholder') && !inputImage.includes('Select+a+Product');
  const displayGenerated = generatedImages[selectedGeneratedIndex] || null;
  const outputImageUrl = resultImageUrl || displayGenerated;
  const hasOutput = Boolean(outputImageUrl);
  const isRemoveBg = selectedTool === 'remove_bg';
  const isScanning = processingStatus === 'uploading' || processingStatus === 'scanning';
  const isRemoveBgDone = isRemoveBg && processingStatus === 'done' && resultImageUrl;

  const handleToolChange = useCallback((value) => setSelectedTool(value), []);

  const handleFileDrop = useCallback((_allFiles, acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setInputImage(URL.createObjectURL(file));
      setResultImageUrl(null);
      setProcessingStatus('idle');
      showToast('Image selected');
    }
  }, [showToast]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputImage(URL.createObjectURL(file));
      setResultImageUrl(null);
      setProcessingStatus('idle');
      showToast('Image selected');
    }
  }, [showToast]);

  const handleBrowseSelectImage = useCallback((url) => {
    setInputImage(url);
    setBrowseModalOpen(false);
    showToast('Image selected');
  }, [showToast]);

  const handleRemoveBackground = useCallback(async () => {
    if (!hasValidInput) return;
    setProcessingStatus('uploading');
    setResultImageUrl(null);
    setJobId(null);
    showToast('Uploading...');

    try {
      const formData = new FormData();
      if (inputImage.startsWith('blob:')) {
        const blob = await fetch(inputImage).then((r) => r.blob());
        formData.append('image', blob, 'upload.png');
      } else if (inputImage.startsWith('http')) {
        formData.append('image', inputImage);
      } else {
        throw new Error('Invalid image source');
      }

      const res = await axios.post('/shopify/remove-background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { status: resStatus, job_id: resJobId, result_url: resResultUrl, generation_id: resGenId } = res.data;
      if (resGenId != null) setGenerationId(resGenId);

      if (resStatus === 'completed' && resResultUrl) {
        setResultImageUrl(resResultUrl);
        setProcessingStatus('done');
        setLastCompletedTool('remove_bg');
        showToast('Background removed');
        refetchRecentGenerations();
        return;
      }
      if (resStatus === 'processing' && resJobId) {
        setJobId(resJobId);
        setProcessingStatus('scanning');
        showToast('AI scanning...');
        return;
      }
      throw new Error(res.data.message || 'Unexpected response');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      let msg =
        data?.message ||
        (data?.errors?.image ? data.errors.image[0] : null) ||
        err.message ||
        'Failed to remove background.';
      if (status === 413) {
        msg = 'Image is too large. Use an image under 15MB or choose one from your store.';
      } else if (status === 503 || status === 502 || status === 504) {
        msg = data?.message || 'Background removal service is temporarily unavailable. Please try again in a moment.';
      }
      showToast(msg, true);
      setProcessingStatus('error');
    }
  }, [hasValidInput, inputImage, showToast, refetchRecentGenerations]);

  const handleUpscale = useCallback(async () => {
    if (!hasValidInput) return;
    setProcessingStatus('uploading');
    setResultImageUrl(null);
    setJobId(null);
    showToast('Starting upscale...');
    try {
      const formData = new FormData();
      if (inputImage.startsWith('blob:')) {
        const blob = await fetch(inputImage).then((r) => r.blob());
        formData.append('image', blob, 'upload.png');
      } else if (inputImage.startsWith('http')) {
        formData.append('image', inputImage);
      } else {
        throw new Error('Invalid image source');
      }
      formData.append('scale', upscaleScale);
      formData.append('face_enhance', upscaleFaceEnhance ? '1' : '0');
      const res = await axios.post('/shopify/tools/upscale', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { job_id: resJobId, generation_id: resGenId } = res.data;
      if (resGenId != null) setGenerationId(resGenId);
      if (res.data.status === 'processing' && resJobId) {
        setJobId(resJobId);
        setProcessingStatus('scanning');
        showToast('Upscaling...');
      } else {
        throw new Error(res.data.message || 'Unexpected response');
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || err.message || 'Upscale failed.';
      showToast(msg, true);
      setProcessingStatus('error');
    }
  }, [hasValidInput, inputImage, upscaleScale, upscaleFaceEnhance, showToast]);

  const handleEnhance = useCallback(async () => {
    if (!hasValidInput) return;
    setProcessingStatus('uploading');
    setResultImageUrl(null);
    setJobId(null);
    showToast('Starting enhance...');
    try {
      const formData = new FormData();
      if (inputImage.startsWith('blob:')) {
        const blob = await fetch(inputImage).then((r) => r.blob());
        formData.append('image', blob, 'upload.png');
      } else if (inputImage.startsWith('http')) {
        formData.append('image', inputImage);
      } else {
        throw new Error('Invalid image source');
      }
      formData.append('version', enhanceVersion);
      formData.append('scale', enhanceScale);
      const res = await axios.post('/shopify/tools/enhance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { job_id: resJobId, generation_id: resGenId } = res.data;
      if (resGenId != null) setGenerationId(resGenId);
      if (res.data.status === 'processing' && resJobId) {
        setJobId(resJobId);
        setProcessingStatus('scanning');
        showToast('Enhancing...');
      } else {
        throw new Error(res.data.message || 'Unexpected response');
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || err.message || 'Enhance failed.';
      showToast(msg, true);
      setProcessingStatus('error');
    }
  }, [hasValidInput, inputImage, enhanceVersion, enhanceScale, showToast]);

  const effectiveLightingPrompt = lightingPromptText.trim();

  const handleLighting = useCallback(async () => {
    if (!hasValidInput || !effectiveLightingPrompt) {
      showToast('Select a lighting preset or enter a custom prompt.', true);
      return;
    }
    setProcessingStatus('uploading');
    setResultImageUrl(null);
    setJobId(null);
    showToast('Starting lighting fix...');
    try {
      const formData = new FormData();
      if (inputImage.startsWith('blob:')) {
        const blob = await fetch(inputImage).then((r) => r.blob());
        formData.append('image', blob, 'upload.png');
      } else if (inputImage.startsWith('http')) {
        formData.append('image', inputImage);
      } else {
        throw new Error('Invalid image source');
      }
      formData.append('prompt', effectiveLightingPrompt);
      const res = await axios.post('/shopify/tools/lighting', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { job_id: resJobId, generation_id: resGenId } = res.data;
      if (resGenId != null) setGenerationId(resGenId);
      if (res.data.status === 'processing' && resJobId) {
        setJobId(resJobId);
        setProcessingStatus('scanning');
        showToast('Applying lighting...');
      } else {
        throw new Error(res.data.message || 'Unexpected response');
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || err.message || 'Lighting fix failed.';
      showToast(msg, true);
      setProcessingStatus('error');
    }
  }, [hasValidInput, inputImage, effectiveLightingPrompt, showToast]);

  const handleMagicEraser = useCallback(async () => {
    if (!hasValidInput || selectedTool !== 'magic_eraser') return;
    const canvas = magicEraserCanvasRef.current;
    if (!canvas || !magicEraserHasStrokes) {
      showToast('Draw over the area you want to erase, then click Erase Object.', true);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mCtx = maskCanvas.getContext('2d');
    if (!mCtx) return;
    mCtx.fillStyle = '#000000';
    mCtx.fillRect(0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const maskData = mCtx.createImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const a = imgData.data[i + 3];
      maskData.data[i] = a > 10 ? 255 : 0;
      maskData.data[i + 1] = a > 10 ? 255 : 0;
      maskData.data[i + 2] = a > 10 ? 255 : 0;
      maskData.data[i + 3] = 255;
    }
    mCtx.putImageData(maskData, 0, 0);
    let maskBase64 = maskCanvas.toDataURL('image/png');
    if (maskBase64.startsWith('data:')) maskBase64 = maskBase64.split(',')[1] || maskBase64;

    setProcessingStatus('uploading');
    setResultImageUrl(null);
    setJobId(null);
    showToast('Starting magic eraser...');
    try {
      const formData = new FormData();
      if (inputImage.startsWith('blob:')) {
        const blob = await fetch(inputImage).then((r) => r.blob());
        formData.append('image', blob, 'upload.png');
      } else if (inputImage.startsWith('http')) {
        formData.append('image', inputImage);
      } else {
        throw new Error('Invalid image source');
      }
      formData.append('mask_base64', maskBase64);
      const res = await axios.post('/shopify/tools/magic-eraser', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { status: resStatus, job_id: resJobId, result_url: resResultUrl, generation_id: resGenId } = res.data;
      if (resGenId != null) setGenerationId(resGenId);
      if (resStatus === 'completed' && resResultUrl) {
        setResultImageUrl(resResultUrl);
        setProcessingStatus('done');
        setLastCompletedTool('magic_eraser');
        showToast('Object erased');
        refetchRecentGenerations();
        return;
      }
      if (resStatus === 'processing' && resJobId) {
        setJobId(resJobId);
        setProcessingStatus('scanning');
        showToast('Erasing object...');
      } else {
        throw new Error(res.data.message || 'Unexpected response');
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || err.message || 'Magic eraser failed.';
      showToast(msg, true);
      setProcessingStatus('error');
    }
  }, [hasValidInput, inputImage, selectedTool, magicEraserHasStrokes, showToast, refetchRecentGenerations]);

  useEffect(() => {
    if (processingStatus !== 'scanning' || !jobId) return;
    const isUpscale = selectedTool === 'upscale';
    const isMagicEraser = selectedTool === 'magic_eraser';
    const isEnhance = selectedTool === 'enhance';
    const isLighting = selectedTool === 'lighting';
    const pollUrl = isMagicEraser
      ? `/shopify/tools/magic-eraser-job/${jobId}`
      : isUpscale
        ? `/shopify/tools/upscale-job/${jobId}`
        : isEnhance
          ? `/shopify/tools/enhance-job/${jobId}`
          : isLighting
            ? `/shopify/tools/lighting-job/${jobId}`
            : `/shopify/background-job/${jobId}`;
    let cancelled = false;
    const maxPolls = 90;
    let pollCount = 0;
    const poll = async () => {
      if (cancelled) return;
      pollCount += 1;
      if (pollCount > maxPolls) {
        showToast('This is taking longer than usual. Please try again or use a smaller image.', true);
        setProcessingStatus('error');
        setJobId(null);
        return;
      }
      try {
        const res = await axios.get(pollUrl);
        if (cancelled) return;
        const { status: resStatus, result_url: resResultUrl, generation_id: resGenId } = res.data;
        if (resGenId != null) setGenerationId(resGenId);
        if (resStatus === 'completed' && resResultUrl) {
          setResultImageUrl(resResultUrl);
          setProcessingStatus('done');
          setJobId(null);
          setLastCompletedTool(isMagicEraser ? 'magic_eraser' : isUpscale ? 'upscale' : isEnhance ? 'enhance' : isLighting ? 'lighting' : 'remove_bg');
          showToast(isMagicEraser ? 'Object erased' : isUpscale ? 'Upscale complete' : isEnhance ? 'Enhance complete' : isLighting ? 'Lighting applied' : 'Background removed');
          refetchRecentGenerations();
          return;
        }
        if (resStatus === 'completed' && !resResultUrl) {
          showToast(isMagicEraser ? 'Magic eraser finished but no image was returned. Please try again.' : isEnhance ? 'Enhance finished but no result URL. Please try again.' : isLighting ? 'Lighting fix finished but no result URL. Please try again.' : 'Done but no result URL.', true);
          setProcessingStatus('error');
          setJobId(null);
          return;
        }
        if (res.data.status === 'error') {
          throw new Error(res.data.message || (isUpscale ? 'Upscale failed' : isEnhance ? 'Enhance failed' : isLighting ? 'Lighting fix failed' : 'Job failed'));
        }
      } catch (err) {
        if (cancelled) return;
        const data = err.response?.data;
        let msg = data?.message || err.message || (isMagicEraser ? 'Magic eraser failed.' : isUpscale ? 'Upscale failed.' : isEnhance ? 'Enhance failed.' : isLighting ? 'Lighting fix failed.' : 'Background removal failed.');
        if (err.response?.status === 503 || err.response?.status === 502 || err.response?.status === 504) {
          msg = data?.message || 'Service temporarily unavailable. Please try again.';
        }
        showToast(msg, true);
        setProcessingStatus('error');
        setJobId(null);
        return;
      }
      if (!cancelled) setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [processingStatus, jobId, selectedTool, showToast, refetchRecentGenerations]);

  const isEnhance = selectedTool === 'enhance';

  const isMagicEraser = selectedTool === 'magic_eraser';
  const isMagicEraserDone = lastCompletedTool === 'magic_eraser' && resultImageUrl && inputImage;

  const handleSaveToShopify = useCallback(async () => {
    const url = resultImageUrl || displayGenerated;
    if (!url) return;
    try {
      const res = await axios.post('/shopify/save-to-shopify', { image_url: url });
      if (res.data.success) {
        showToast(res.data.message || 'Saved to Shopify Files');
      } else {
        throw new Error(res.data.message || 'Save failed');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to save to Shopify', true);
    }
  }, [resultImageUrl, displayGenerated, showToast]);

  // Resolve generation id for "Save to Product": prefer state, else match current result in recent list (e.g. newly completed).
  const effectiveGenerationId =
    generationId ??
    (resultImageUrl
      ? recentGenerations.find((g) => g.result_image_url === resultImageUrl)?.id
      : null);

  const handleSaveToProduct = useCallback(async () => {
    const idToUse = effectiveGenerationId ?? generationId;
    if (idToUse == null) {
      showToast('No generation to assign. Generate an image first.', true);
      return;
    }
    const shopify = shopifyAppBridge;
    if (!shopify?.resourcePicker) {
      showToast('Open this app from Shopify Admin to use Save to Product.', true);
      return;
    }
    try {
      const selection = await shopify.resourcePicker({
        type: 'product',
        action: 'select',
        multiple: false,
      });
      const selected = Array.isArray(selection) ? selection : (selection && selection.selection) ?? [];
      if (!selected.length) return;
      const product = selected[0];
      const productId = product.admin_graphql_api_id ?? product.id ?? String(product.id);
      const res = await axios.post('/shopify/assign-to-product', {
        product_id: productId,
        generation_id: Number(idToUse),
      });
      if (res.data.success) {
        showToast(res.data.message || 'Image added to product.');
        setRecentGenerations((prev) =>
          prev.map((g) => (g.id === idToUse ? { ...g, shopify_product_id: productId } : g))
        );
      } else throw new Error(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add to product.';
      showToast(msg, true);
    }
  }, [effectiveGenerationId, generationId, showToast, shopifyAppBridge]);

  const handleGenerateAIBackground = useCallback(() => {
    showToast('✨ Generate AI Background — coming soon');
  }, [showToast]);

  const handleReset = useCallback(() => {
    setInputImage(null);
    setResultImageUrl(null);
    setProcessingStatus('idle');
    setJobId(null);
    setGenerationId(null);
    setLastCompletedTool(null);
    setCompareSliderPosition(50);
    setMagicEraserHasStrokes(false);
    const canvas = magicEraserCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleGenerate = async () => {
    if (!hasValidInput) {
      showToast('Please upload or select an image first');
      return;
    }
    if (isRemoveBg) {
      handleRemoveBackground();
      return;
    }
    if (selectedTool === 'upscale') {
      handleUpscale();
      return;
    }
    if (selectedTool === 'magic_eraser') {
      handleMagicEraser();
      return;
    }
    if (selectedTool === 'enhance') {
      handleEnhance();
      return;
    }
    if (selectedTool === 'lighting') {
      handleLighting();
      return;
    }
    showToast('Use Background Remover, Upscaler, Magic Eraser, Image Enhancer, or Lighting Fix.', true);
  };

  const handleDownload = useCallback(() => {
    const url = resultImageUrl || displayGenerated;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-studio-output.png';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started');
  }, [resultImageUrl, displayGenerated, showToast]);

  useEffect(() => {
    if (initialImage && initialImage !== inputImage) setInputImage(initialImage);
  }, [initialImage]);

  useEffect(() => {
    if (selectedTool !== 'magic_eraser' || !inputImage || !hasValidInput) return;
    const wrap = magicEraserWrapRef.current;
    const img = magicEraserImageRef.current;
    const canvas = magicEraserCanvasRef.current;
    if (!wrap || !img || !canvas) return;
    const onLoad = () => {
      const w = img.offsetWidth || img.clientWidth || 0;
      const h = img.offsetHeight || img.clientHeight || 0;
      if (w <= 0 || h <= 0) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255, 122, 48, 0.4)'; /* app orange, low opacity */
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      let drawing = false;
      let lastX = 0;
      let lastY = 0;
      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
      };
      const start = (e) => {
        e.preventDefault();
        drawing = true;
        const { x, y } = getPos(e);
        lastX = x;
        lastY = y;
        ctx.lineWidth = magicEraserBrushSizeRef.current;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        setMagicEraserHasStrokes(true);
      };
      const move = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        ctx.lineWidth = magicEraserBrushSizeRef.current;
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
      };
      const end = () => { drawing = false; };
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('mouseleave', end);
    };
    if (img.complete && img.naturalWidth) onLoad();
    else img.addEventListener('load', onLoad);
    return () => img.removeEventListener('load', onLoad);
  }, [selectedTool, inputImage, hasValidInput]);

  const handleClearMagicEraserMask = useCallback(() => {
    const canvas = magicEraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMagicEraserHasStrokes(false);
  }, []);
  useEffect(() => {
    if (initialTool && VALID_TOOLS.includes(initialTool)) setSelectedTool(initialTool);
  }, [initialTool]);
  useEffect(() => {
    if (!isRemoveBg && selectedTool !== 'upscale' && selectedTool !== 'magic_eraser' && selectedTool !== 'enhance' && selectedTool !== 'lighting') {
      setResultImageUrl(null);
      setProcessingStatus('idle');
      setJobId(null);
      setLastCompletedTool(null);
      setCompareSliderPosition(50);
    }
  }, [selectedTool, isRemoveBg]);
  useEffect(() => {
    if (!toast || toast.isError) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    refetchRecentGenerations();
  }, [isRemoveBgDone, refetchRecentGenerations]);

  const filteredGenerations = useMemo(() => {
    let filtered = galleryToolFilter === 'all'
      ? recentGenerations
      : recentGenerations.filter((g) => (g.tool_used || '') === galleryToolFilter);

    if (galleryDateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((g) => {
        const gDate = new Date(g.updated_at || g.created_at);
        if (galleryDateFilter === 'today') {
          return gDate.toDateString() === now.toDateString();
        }
        const diffDays = (now - gDate) / (1000 * 60 * 60 * 24);
        if (galleryDateFilter === 'last_7_days') {
          return diffDays <= 7;
        }
        if (galleryDateFilter === 'last_30_days') {
          return diffDays <= 30;
        }
        return true;
      });
    }
    return filtered;
  }, [recentGenerations, galleryToolFilter, galleryDateFilter]);

  const handleExportZip = useCallback(async () => {
    let gensToExport = filteredGenerations;
    if (exportType === 'specific_tool') {
      gensToExport = recentGenerations.filter((g) => (g.tool_used || '') === exportSpecificTool);
    }

    if (!gensToExport || gensToExport.length === 0) {
      showToast('No creations to export');
      setExportModalOpen(false);
      return;
    }
    setIsExporting(true);
    showToast(`Gathering ${gensToExport.length} images for export...`);

    try {
      const zip = new JSZip();

      const promises = gensToExport.map(async (gen, index) => {
        try {
          const response = await fetch(gen.result_image_url);
          if (!response.ok) throw new Error('Failed to fetch image');
          const blob = await response.blob();

          let folderPath = '';
          if (exportType === 'categories') {
            const tool = gen.tool_used || 'uncategorized';
            folderPath = `${tool}/`;
          }

          const filename = `${folderPath}masterpiece-${index + 1}.png`;
          zip.file(filename, blob);
        } catch (err) {
          console.error('Failed to zip image', err);
        }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'ai-studio-export.zip');

      showToast('Export successful!');
      setExportModalOpen(false);
    } catch (err) {
      showToast('Failed to create export ZIP', true);
    } finally {
      setIsExporting(false);
    }
  }, [filteredGenerations, exportType, showToast]);

  const dropZoneContent = (
    <DropZone.FileUpload
      actionHint="PNG, JPG or WebP (max 15MB)"
      actionTitle="Drop or click to upload"
    />
  );

  return (
    <ShopifyLayout>
      <Page
        title="AI Studio"
        subtitle="Professional-grade image enhancement. Create in seconds."
      >
        <BlockStack gap="400">
          {toast &&
            createPortal(
              <div
                className={`premium-toast ${toast.isError ? 'premium-toast--error' : 'premium-toast--success'}`}
                role={toast.isError ? 'alert' : 'status'}
                aria-live={toast.isError ? 'assertive' : 'polite'}
              >
                <span className="premium-toast__message">{toast.message}</span>
                {toast.isError && (
                  <Button variant="plain" tone="inherit" size="slim" onClick={dismissToast} accessibilityLabel="Dismiss">
                    Dismiss
                  </Button>
                )}
              </div>,
              document.body
            )}

          <Layout>
            {/* Hero Canvas (left) – massive output area */}
            <Layout.Section>
              <Card padding="0" className="aistudio-hero-card">
                <div className={`aistudio-hero-canvas${(isProcessing || isScanning) ? ' aistudio-hero-canvas--processing' : ''}`}>
                  {isRemoveBg && isScanning && hasValidInput ? (
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img
                          src={inputImage}
                          alt=""
                          className="premium-scanning-img"
                        />
                        <div className="premium-scanning-badge" aria-live="polite">
                          ✨ AI is extracting subject...
                        </div>
                      </div>
                    </div>
                  ) : selectedTool === 'upscale' && isScanning && hasValidInput ? (
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img
                          src={inputImage}
                          alt=""
                          className="premium-scanning-img"
                        />
                        <div className="premium-scanning-badge" aria-live="polite">
                          Upscaling...
                        </div>
                      </div>
                    </div>
                  ) : selectedTool === 'magic_eraser' && isScanning && hasValidInput ? (
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img
                          src={inputImage}
                          alt=""
                          className="premium-scanning-img"
                        />
                        <div className="premium-scanning-badge" aria-live="polite">
                          ✨ Erasing object...
                        </div>
                      </div>
                    </div>
                  ) : selectedTool === 'enhance' && isScanning && hasValidInput ? (
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img
                          src={inputImage}
                          alt=""
                          className="premium-scanning-img"
                        />
                        <div className="premium-scanning-badge" aria-live="polite">
                          Enhancing...
                        </div>
                      </div>
                    </div>
                  ) : selectedTool === 'lighting' && isScanning && hasValidInput ? (
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img
                          src={inputImage}
                          alt=""
                          className="premium-scanning-img"
                        />
                        <div className="premium-scanning-badge" aria-live="polite">
                          Applying lighting...
                        </div>
                      </div>
                    </div>
                  ) : selectedTool === 'magic_eraser' && hasValidInput && !resultImageUrl && !isScanning ? (
                    <div
                      className="aistudio-magic-eraser-draw"
                      ref={magicEraserWrapRef}
                      onMouseMove={(e) => {
                        const wrap = magicEraserWrapRef.current;
                        if (!wrap) return;
                        const rect = wrap.getBoundingClientRect();
                        setMagicEraserCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        setMagicEraserCursorVisible(true);
                      }}
                      onMouseLeave={() => setMagicEraserCursorVisible(false)}
                    >
                      <div className="aistudio-magic-eraser-wrap">
                        <img
                          ref={magicEraserImageRef}
                          src={inputImage}
                          alt=""
                          className="aistudio-magic-eraser-img"
                        />
                        <canvas
                          ref={magicEraserCanvasRef}
                          className="aistudio-magic-eraser-canvas"
                          width={0}
                          height={0}
                          aria-label="Draw over the area to erase"
                        />
                      </div>
                      {magicEraserCursorVisible && (
                        <div
                          ref={magicEraserCursorRef}
                          className="aistudio-magic-eraser-cursor"
                          style={{
                            left: magicEraserCursorPos.x,
                            top: magicEraserCursorPos.y,
                            width: magicEraserBrushSize,
                            height: magicEraserBrushSize,
                            marginLeft: -magicEraserBrushSize / 2,
                            marginTop: -magicEraserBrushSize / 2,
                          }}
                          aria-hidden
                        />
                      )}
                    </div>
                  ) : isRemoveBgDone ? (
                    <div className="aistudio-hero-result-container">
                      <div className="aistudio-hero-result-wrap">
                        <div className="aistudio-result-checkerboard aistudio-result-image-wrap">
                          <img
                            src={resultImageUrl}
                            alt="Background removed"
                            className="aistudio-hero-result-img"
                            onError={(e) => {
                              const img = e.target;
                              const src = img?.src || resultImageUrl;
                              let path = src;
                              try {
                                if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname;
                              } catch (_) { /* ignore */ }
                              if (path && typeof path === 'string' && path.startsWith('/storage/') && typeof window !== 'undefined') {
                                img.src = window.location.origin + path;
                              } else {
                                showToast('Result image could not be loaded. The link may have expired.', true);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="aistudio-hero-actions aistudio-hero-actions--outside">
                        <InlineStack gap="300">
                          <Button
                            variant="primary"
                            size="medium"
                            className="aistudio-btn-download"
                            onClick={handleDownload}
                            accessibilityLabel="Download image"
                          >
                            Download
                          </Button>
                          <Button
                            variant="secondary"
                            size="medium"
                            className="aistudio-btn-save"
                            onClick={handleSaveToProduct}
                            accessibilityLabel="Save to Product"
                          >
                            Save to Product
                          </Button>
                          <Button
                            variant="secondary"
                            size="medium"
                            onClick={handleGenerateAIBackground}
                            accessibilityLabel="Generate AI Background"
                          >
                            ✨ Generate AI Background
                          </Button>
                        </InlineStack>
                      </div>
                    </div>
                  ) : (lastCompletedTool === 'upscale' || lastCompletedTool === 'magic_eraser' || lastCompletedTool === 'enhance' || lastCompletedTool === 'lighting') && resultImageUrl && inputImage ? (
                    <div className="aistudio-hero-result-container">
                      <div className="aistudio-compare-slider-wrap">
                        <div className="aistudio-compare-slider">
                          <div className="aistudio-compare-before" style={{ clipPath: `inset(0 ${100 - compareSliderPosition}% 0 0)` }}>
                            <img src={inputImage} alt="Before" />
                          </div>
                          <div className="aistudio-compare-after" style={{ clipPath: `inset(0 0 0 ${compareSliderPosition}%)` }}>
                            <img
                              src={resultImageUrl}
                              alt="After"
                              onError={(e) => {
                                const img = e.target;
                                const src = img?.src || resultImageUrl;
                                let path = src;
                                try {
                                  if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname;
                                } catch (_) { /* ignore */ }
                                if (path && typeof path === 'string' && path.startsWith('/storage/') && typeof window !== 'undefined') {
                                  const sameOriginUrl = window.location.origin + path;
                                  if (sameOriginUrl !== src) {
                                    img.src = sameOriginUrl;
                                    return;
                                  }
                                }
                                showToast('Result image could not be loaded. The link may have expired.', true);
                                setResultImageUrl(null);
                              }}
                            />
                          </div>
                          <div
                            className="aistudio-compare-divider"
                            style={{ left: `${compareSliderPosition}%` }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const wrap = e.target?.closest('.aistudio-compare-slider-wrap');
                              if (!wrap) return;
                              const move = (e2) => {
                                const rect = wrap.getBoundingClientRect();
                                const x = ((e2.clientX - rect.left) / rect.width) * 100;
                                setCompareSliderPosition((p) => Math.min(100, Math.max(0, x)));
                              };
                              const up = () => {
                                document.removeEventListener('mousemove', move);
                                document.removeEventListener('mouseup', up);
                              };
                              document.addEventListener('mousemove', move);
                              document.addEventListener('mouseup', up);
                            }}
                            role="slider"
                            aria-valuenow={compareSliderPosition}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Before / After comparison"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              const step = e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0;
                              if (step) {
                                e.preventDefault();
                                setCompareSliderPosition((p) => Math.min(100, Math.max(0, p + step)));
                              }
                            }}
                          >
                            <span className="aistudio-compare-handle">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M12 6L8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M8 6L12 10L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="aistudio-hero-actions aistudio-hero-actions--outside">
                        <InlineStack gap="300">
                          <Button variant="primary" size="medium" onClick={handleDownload} accessibilityLabel="Download image">Download</Button>
                          <Button variant="secondary" size="medium" onClick={handleSaveToProduct} accessibilityLabel="Save to Product">Save to Product</Button>
                        </InlineStack>
                      </div>
                    </div>
                  ) : isProcessing && hasValidInput ? (
                    <>
                      <div className="aistudio-hero-loading-bg">
                        <img src={inputImage} alt="" />
                      </div>
                      <div className="aistudio-hero-loading-overlay">
                        <div className="aistudio-hero-pulse" />
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Synthesizing pixels...
                        </Text>
                      </div>
                    </>
                  ) : displayGenerated ? (
                    <div className="aistudio-hero-result-container">
                      <div className="aistudio-hero-result-wrap">
                        <img
                          src={displayGenerated}
                          alt="AI generated output"
                          className="aistudio-hero-result-img"
                        />
                        {generatedImages.length > 1 && (
                          <div className="aistudio-thumb-strip aistudio-thumb-strip-hero">
                            {generatedImages.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                className={`aistudio-thumb-btn ${selectedGeneratedIndex === i ? 'active' : ''}`}
                                onClick={() => setSelectedGeneratedIndex(i)}
                                aria-pressed={selectedGeneratedIndex === i}
                                aria-label={`View result ${i + 1}`}
                              >
                                <Thumbnail source={img} alt="" size="small" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="aistudio-hero-actions aistudio-hero-actions--outside">
                        <InlineStack gap="300">
                          <Button
                            variant="primary"
                            size="medium"
                            className="aistudio-btn-download"
                            onClick={handleDownload}
                            accessibilityLabel="Download image"
                          >
                            Download
                          </Button>
                          <Button
                            variant="secondary"
                            size="medium"
                            className="aistudio-btn-save"
                            onClick={handleSaveToShopify}
                            accessibilityLabel="Save to Store"
                          >
                            Save to Store
                          </Button>
                        </InlineStack>
                      </div>
                    </div>
                  ) : (
                    <div className="aistudio-hero-empty">
                      <div className="aistudio-hero-empty-illustration">
                        <MasterpieceIllustration />
                      </div>
                      <Text as="h2" variant="headingLg">Your masterpiece awaits</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {recentGenerations.length > 0
                          ? "You are doing a great job creating stunning visuals!"
                          : "Upload an image and let the AI do the magic."}
                      </Text>
                      <Box paddingBlockStart="400">
                        <InlineStack gap="300" blockAlign="center" wrap>
                          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                            Upload image
                          </Button>
                          <Button variant="plain" onClick={() => setBrowseModalOpen(true)}>
                            Browse from Store
                          </Button>
                        </InlineStack>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </Box>
                    </div>
                  )}
                </div>
              </Card>
            </Layout.Section>

            {/* Command Center (right) – compact control panel */}
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="400">
                  <Select
                    label=""
                    labelHidden
                    options={AI_TOOLS}
                    value={selectedTool}
                    onChange={handleToolChange}
                  />

                  {selectedTool === 'bg_swap' && (
                    <BlockStack gap="200">
                      <Text variant="bodySm" as="span" tone="subdued">Style preset</Text>
                      <InlineStack gap="200" wrap>
                        {BG_STYLES.map((s) => (
                          <Button
                            key={s.value}
                            variant={selectedStyle === s.value ? 'primary' : 'tertiary'}
                            size="slim"
                            onClick={() => setSelectedStyle(s.value)}
                            pressed={selectedStyle === s.value}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </InlineStack>
                    </BlockStack>
                  )}

                  {selectedTool === 'upscale' && (
                    <BlockStack gap="200">
                      <Text variant="bodySm" as="span" tone="subdued">Upscale factor</Text>
                      <Select
                        label=""
                        labelHidden
                        options={UPSCALE_SCALE_OPTIONS}
                        value={upscaleScale}
                        onChange={setUpscaleScale}
                      />
                      <Checkbox
                        label="Enhance faces (GFPGAN)"
                        checked={upscaleFaceEnhance}
                        onChange={setUpscaleFaceEnhance}
                      />
                    </BlockStack>
                  )}

                  {selectedTool === 'magic_eraser' && (
                    <BlockStack gap="200">
                      <RangeSlider
                        label="Brush size"
                        value={magicEraserBrushSize}
                        min={10}
                        max={100}
                        output
                        suffix="px"
                        onChange={(value) => setMagicEraserBrushSize(Number(value))}
                        helpText="Draw over the object you want to remove"
                      />
                      <Button
                        variant="secondary"
                        size="slim"
                        onClick={handleClearMagicEraserMask}
                        disabled={!magicEraserHasStrokes}
                        accessibilityLabel="Clear mask"
                      >
                        Clear Mask
                      </Button>
                    </BlockStack>
                  )}

                  {selectedTool === 'enhance' && (
                    <BlockStack gap="200">
                      <Text variant="bodySm" as="span" tone="subdued">Enhancement version</Text>
                      <Select
                        label=""
                        labelHidden
                        options={ENHANCE_VERSION_OPTIONS}
                        value={enhanceVersion}
                        onChange={setEnhanceVersion}
                      />
                      <Text variant="bodySm" as="span" tone="subdued">Scale / sharpness</Text>
                      <Select
                        label=""
                        labelHidden
                        options={ENHANCE_SCALE_OPTIONS}
                        value={enhanceScale}
                        onChange={setEnhanceScale}
                      />
                    </BlockStack>
                  )}

                  {selectedTool === 'lighting' && (
                    <BlockStack gap="200">
                      <Text variant="bodySm" as="span" tone="subdued">Lighting preset</Text>
                      <Select
                        label=""
                        labelHidden
                        options={LIGHTING_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
                        value={lightingPreset}
                        onChange={(value) => {
                          setLightingPreset(value);
                          const preset = LIGHTING_PRESETS.find((p) => p.value === value);
                          if (preset?.prompt) setLightingPromptText(preset.prompt);
                          else if (value === 'custom') setLightingPromptText('');
                        }}
                      />
                      <TextField
                        label="Lighting prompt"
                        value={lightingPromptText}
                        onChange={setLightingPromptText}
                        placeholder="Select a preset to pre-fill, or type your own (e.g. Soft golden hour from the right)"
                        multiline={3}
                        autoComplete="off"
                        characterCount={lightingPromptText.length}
                        maxLength={1000}
                        helpText="Pre-filled from the preset above. Edit it or use as-is, then click Generate."
                      />
                    </BlockStack>
                  )}

                  <BlockStack gap="200">
                    <Text variant="bodySm" as="span" tone="subdued">
                      {hasOutput ? 'Source → Output' : 'Source image'}
                    </Text>
                    {hasValidInput ? (
                      <BlockStack gap="200">
                        {hasOutput ? (
                          <div className="aistudio-panel-source-output">
                            <div className="aistudio-panel-thumb">
                              <img src={inputImage} alt="Source" />
                            </div>
                            <span className="aistudio-panel-arrow" aria-hidden>
                              <Icon source={ArrowRightIcon} tone="subdued" />
                            </span>
                            <div className="aistudio-panel-thumb aistudio-panel-thumb-output aistudio-panel-thumb-checkerboard">
                              <img
                                src={outputImageUrl}
                                alt="Output"
                                onError={(e) => {
                                  const img = e.target;
                                  const src = img?.src || outputImageUrl;
                                  let path = src;
                                  try {
                                    if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname;
                                  } catch (_) { /* ignore */ }
                                  if (path && typeof path === 'string' && path.startsWith('/storage/') && typeof window !== 'undefined') {
                                    img.src = window.location.origin + path;
                                  }
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="aistudio-panel-thumb">
                            <img src={inputImage} alt="Source" />
                          </div>
                        )}
                        {!resultImageUrl && (
                          <InlineStack gap="200" blockAlign="center">
                            <Button
                              variant="plain"
                              size="slim"
                              onClick={() => fileInputRef.current?.click()}
                              accessibilityLabel="Replace image"
                              disabled={isScanning || isProcessing}
                            >
                              Replace
                            </Button>
                            <Button
                              variant="plain"
                              size="slim"
                              onClick={() => setBrowseModalOpen(true)}
                              accessibilityLabel="Browse from Store"
                              disabled={isScanning || isProcessing}
                            >
                              Browse from Store
                            </Button>
                            <Button
                              variant="plain"
                              tone="critical"
                              size="slim"
                              onClick={handleReset}
                              accessibilityLabel="Remove"
                              disabled={isScanning || isProcessing}
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </BlockStack>
                    ) : (
                      <>
                        <DropZone
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          type="image"
                          onDrop={handleFileDrop}
                          variableHeight
                        >
                          {dropZoneContent}
                        </DropZone>
                        <Box paddingBlockStart="100">
                          <Button variant="plain" size="slim" onClick={() => setBrowseModalOpen(true)}>
                            or Browse from Store
                          </Button>
                        </Box>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </>
                    )}
                  </BlockStack>

                  {/* Advanced instructions (prompt): for future tools; not used by remove_bg, upscale, magic_eraser, enhance, or lighting */}
                  {!isRemoveBg && selectedTool !== 'upscale' && selectedTool !== 'magic_eraser' && selectedTool !== 'enhance' && selectedTool !== 'lighting' && (
                    <BlockStack gap="200">
                      <Text variant="bodySm" as="span" tone="subdued">Advanced instructions</Text>
                      <TextField
                        label=""
                        labelHidden
                        value={prompt}
                        onChange={setPrompt}
                        placeholder="Describe the magic you want to see..."
                        multiline={3}
                        autoComplete="off"
                        characterCount={prompt.length}
                        maxLength={500}
                      />
                    </BlockStack>
                  )}

                  <Box paddingBlockStart="200">
                    {resultImageUrl ? (
                      <BlockStack gap="200">
                        <Button
                          fullWidth
                          variant="secondary"
                          size="large"
                          icon={PlusCircleIcon}
                          onClick={handleReset}
                          accessibilityLabel="Start new image"
                        >
                          Start New Image
                        </Button>
                      </BlockStack>
                    ) : (
                      <BlockStack gap="200">
                        <MagicButton
                          fullWidth
                          size="large"
                          onClick={handleGenerate}
                          loading={isProcessing || (isRemoveBg && isScanning) || (selectedTool === 'upscale' && isScanning) || (selectedTool === 'magic_eraser' && isScanning) || (selectedTool === 'enhance' && isScanning) || (selectedTool === 'lighting' && isScanning)}
                          disabled={!hasValidInput || isProcessing || (isRemoveBg && isScanning) || (selectedTool === 'upscale' && isScanning) || (selectedTool === 'magic_eraser' && (isScanning || !magicEraserHasStrokes)) || (selectedTool === 'enhance' && isScanning) || (selectedTool === 'lighting' && (isScanning || !effectiveLightingPrompt))}
                        >
                          {selectedTool === 'magic_eraser' ? '✨ Erase Object' : '✨ Generate'}
                        </MagicButton>
                        <Text variant="bodySm" tone="subdued">(1 Credit)</Text>
                      </BlockStack>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>

          {/* Recent Masterpieces – dynamic grid gallery */}
          <Box paddingBlockStart="600">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center" wrap gap="400">
                  <Text as="h2" variant="headingMd">Recent Masterpieces</Text>
                  <InlineStack gap="300" blockAlign="center" wrap>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">Date:</Text>
                      <Select
                        label=""
                        labelHidden
                        options={GALLERY_DATE_OPTIONS}
                        value={galleryDateFilter}
                        onChange={setGalleryDateFilter}
                      />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">Tool:</Text>
                      <Select
                        label=""
                        labelHidden
                        options={GALLERY_TOOL_OPTIONS}
                        value={galleryToolFilter}
                        onChange={setGalleryToolFilter}
                      />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">Grid:</Text>
                      <Select
                        label=""
                        labelHidden
                        options={[
                          { value: '3', label: '3 columns' },
                          { value: '4', label: '4 columns' },
                          { value: '5', label: '5 columns' },
                          { value: '6', label: '6 columns' },
                        ]}
                        value={String(gridColumns)}
                        onChange={(v) => setGridColumns(Number(v))}
                      />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Button icon={ExportIcon} onClick={() => setExportModalOpen(true)}>
                        Export
                      </Button>
                    </InlineStack>
                  </InlineStack>
                </InlineStack>
                {(() => {
                  const filtered = filteredGenerations;

                  return filtered.length === 0 ? (
                    <div className="aistudio-gallery-empty">
                      <div className="aistudio-gallery-empty-icon" aria-hidden>
                        <Icon source={ImageMagicIcon} tone="subdued" />
                      </div>
                      <Text as="h3" variant="headingMd">
                        {recentGenerations.length === 0
                          ? 'Your gallery will appear here'
                          : `No creations for ${GALLERY_TOOL_OPTIONS.find((o) => o.value === galleryToolFilter)?.label ?? 'this tool'}`}
                      </Text>
                    </div>
                  ) : (
                    <div
                      className="aistudio-gallery"
                      style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
                    >
                      {filtered.map((gen) => (
                        <div key={gen.id} className="aistudio-gallery-card">
                          <div className="aistudio-gallery-card-image-wrap">
                            <div className="aistudio-gallery-card-checkerboard">
                              <img
                                src={gen.result_image_url}
                                alt=""
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.target;
                                  const src = img?.src || gen.result_image_url;
                                  let path = src;
                                  try {
                                    if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname;
                                  } catch (_) { /* ignore */ }
                                  if (path && typeof path === 'string' && path.startsWith('/storage/') && typeof window !== 'undefined') {
                                    img.src = window.location.origin + path;
                                  }
                                }}
                              />
                            </div>
                            <div className="aistudio-gallery-card-overlay">
                              <InlineStack gap="200" blockAlign="center">
                                <Tooltip content="Download">
                                  <Button
                                    size="slim"
                                    icon={ExportIcon}
                                    accessibilityLabel="Download"
                                    onClick={() => {
                                      const a = document.createElement('a');
                                      a.href = gen.result_image_url;
                                      a.download = 'masterpiece.png';
                                      a.target = '_blank';
                                      a.rel = 'noopener noreferrer';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      showToast('Download started');
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip content="Save to Product">
                                  <Button
                                    size="slim"
                                    icon={ImageIcon}
                                    accessibilityLabel="Save to Product"
                                    onClick={async () => {
                                      setGenerationId(gen.id);
                                      const shopify = shopifyAppBridge;
                                      if (!shopify?.resourcePicker) {
                                        showToast('Open this app from Shopify Admin to use Save to Product.', true);
                                        return;
                                      }
                                      try {
                                        const selection = await shopify.resourcePicker({ type: 'product', action: 'select', multiple: false });
                                        const selected = Array.isArray(selection) ? selection : (selection && selection.selection) ?? [];
                                        if (!selected.length) return;
                                        const product = selected[0];
                                        const productId = product.admin_graphql_api_id ?? product.id ?? String(product.id);
                                        const res = await axios.post('/shopify/assign-to-product', { product_id: productId, generation_id: gen.id });
                                        if (res.data.success) {
                                          showToast(res.data.message);
                                          setRecentGenerations((prev) =>
                                            prev.map((g) => (g.id === gen.id ? { ...g, shopify_product_id: productId } : g))
                                          );
                                        } else throw new Error(res.data.message);
                                      } catch (err) {
                                        showToast(err.response?.data?.message || err.message || 'Failed to add to product.', true);
                                      }
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip content="Add Background">
                                  <Button
                                    size="slim"
                                    icon={ImageMagicIcon}
                                    accessibilityLabel="Add Background"
                                    onClick={() => showToast('✨ Generate AI Background — coming soon')}
                                  />
                                </Tooltip>
                              </InlineStack>
                            </div>
                          </div>
                          <div className="aistudio-gallery-card-meta">
                            <Text as="span" variant="bodySm" tone="subdued">
                              {timeAgo(gen.updated_at || gen.created_at)}
                            </Text>
                            {gen.shopify_product_id && (
                              <Text as="span" variant="bodySm" tone="subdued">
                                {' · '}On product
                              </Text>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </BlockStack>
            </Card>
          </Box>
        </BlockStack>

        <BrowseFromStore
          open={browseModalOpen}
          onClose={() => setBrowseModalOpen(false)}
          onSelectImage={handleBrowseSelectImage}
        />

        <Modal
          open={exportModalOpen}
          onClose={() => !isExporting && setExportModalOpen(false)}
          title="Export Your Masterpieces"
          primaryAction={{
            content: isExporting ? 'Creating ZIP...' : 'Export',
            onAction: handleExportZip,
            loading: isExporting,
            disabled: isExporting || (exportType === 'specific_tool'
              ? recentGenerations.filter(g => (g.tool_used || '') === exportSpecificTool).length === 0
              : filteredGenerations.length === 0
            ),
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setExportModalOpen(false),
              disabled: isExporting,
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p" tone="subdued">
                We value your privacy and data security. All of your creations are securely processed and are fully ready for download. Please select how you'd like to organize your exported files.
              </Text>

              <Text as="p" tone="subdued">
                <strong>Instructions:</strong><br />
                1. Select your preferred export format below.<br />
                2. Click "Export" to automatically assemble your ZIP file.<br />
                3. Keep this window open until the download is complete. Large exports may take a few moments.
              </Text>

              <ChoiceList
                title="Export Organization"
                choices={[
                  { label: 'All in one folder (Uses current filters)', value: 'flat' },
                  { label: 'Organized by Category (Uses current filters)', value: 'categories', helpText: 'Creates a separate folder for each AI tool inside the zip file.' },
                  { label: 'Specific Tool (Ignores filters)', value: 'specific_tool', helpText: 'Download all creations specifically for one AI tool.' },
                ]}
                selected={[exportType]}
                onChange={(val) => setExportType(val[0])}
              />

              {exportType === 'specific_tool' && (
                <Box paddingBlockStart="200">
                  <Select
                    label="Select Tool to Export"
                    options={GALLERY_TOOL_OPTIONS.filter(o => o.value !== 'all').map(o => {
                      const count = recentGenerations.filter(g => (g.tool_used || '') === o.value).length;
                      return {
                        value: o.value,
                        label: `${o.label} (${count})`
                      };
                    })}
                    value={exportSpecificTool}
                    onChange={setExportSpecificTool}
                  />
                </Box>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      </Page>
    </ShopifyLayout>
  );
}
