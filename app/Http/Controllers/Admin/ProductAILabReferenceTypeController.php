<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendProductAILabSettingsSecurityEmailJob;
use App\Models\ProductAILabReferenceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductAILabReferenceTypeController extends Controller
{
    /**
     * List all reference types
     */
    public function index()
    {
        try {
            $referenceTypes = ProductAILabReferenceType::ordered()->get();
            $totalMaxImages = ProductAILabReferenceType::getTotalMaxImages();
            $remainingImages = ProductAILabReferenceType::getRemainingImages();

            return response()->json([
                'reference_types' => $referenceTypes,
                'total_max_images' => $totalMaxImages,
                'remaining_images' => $remainingImages,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Failed to load product AI lab reference types', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to load reference types',
            ], 500);
        }
    }

    /**
     * Store a new reference type
     */
    public function store(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validation
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|regex:/^[a-z0-9_]+$/|max:255',
                'description' => 'nullable|string|max:1000',
                'prompt_template' => 'required|string|max:2000',
                'max_images_allowed' => 'required|integer|min:1|max:14',
                'is_enabled' => 'boolean',
            ]);

            // Generate slug if not provided
            $slug = $validated['slug'] ?? ProductAILabReferenceType::generateSlug($validated['name']);

            // Check slug uniqueness
            if (!ProductAILabReferenceType::isSlugUnique($slug)) {
                return response()->json([
                    'message' => 'Slug must be unique',
                    'errors' => ['slug' => ['Slug already exists']],
                ], 422);
            }

            // Check total images limit
            if (!ProductAILabReferenceType::canAddImages($validated['max_images_allowed'])) {
                $remaining = ProductAILabReferenceType::getRemainingImages();
                return response()->json([
                    'message' => "Cannot add more images. Only $remaining image slots remaining (max 14 total)",
                    'errors' => ['max_images_allowed' => ["Only $remaining image slots remaining"]],
                ], 422);
            }

            // Create reference type
            $referenceType = ProductAILabReferenceType::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'],
                'prompt_template' => $validated['prompt_template'],
                'max_images_allowed' => $validated['max_images_allowed'],
                'is_enabled' => $validated['is_enabled'] ?? true,
                'created_by' => $admin->email,
                'updated_by' => $admin->email,
            ]);

            Log::channel('admin')->info('Product AI Lab reference type created', [
                'reference_type_id' => $referenceType->id,
                'slug' => $slug,
                'admin' => $admin->email,
            ]);

            // Send notification email
            SendProductAILabSettingsSecurityEmailJob::dispatch(
                $admin,
                ['reference_type_added' => $referenceType->toArray()],
                isReferenceTypeChange: true
            );

            return response()->json([
                'message' => 'Reference type created successfully',
                'reference_type' => $referenceType,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Failed to create product AI lab reference type', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to create reference type',
            ], 500);
        }
    }

    /**
     * Get a single reference type
     */
    public function show($id)
    {
        try {
            $referenceType = ProductAILabReferenceType::findOrFail($id);

            return response()->json([
                'reference_type' => $referenceType,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Reference type not found',
            ], 404);
        }
    }

    /**
     * Update a reference type
     */
    public function update(Request $request, $id)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $referenceType = ProductAILabReferenceType::findOrFail($id);
            $oldValues = $referenceType->toArray();

            // Validation
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|regex:/^[a-z0-9_]+$/|max:255',
                'description' => 'nullable|string|max:1000',
                'prompt_template' => 'required|string|max:2000',
                'max_images_allowed' => 'required|integer|min:1|max:14',
                'is_enabled' => 'boolean',
            ]);

            // Generate or validate slug
            $slug = $validated['slug'] ?? ProductAILabReferenceType::generateSlug($validated['name']);

            if ($slug !== $referenceType->slug) {
                if (!ProductAILabReferenceType::isSlugUnique($slug, $referenceType->id)) {
                    return response()->json([
                        'message' => 'Slug must be unique',
                        'errors' => ['slug' => ['Slug already exists']],
                    ], 422);
                }
            }

            // Check images limit if changing max_images_allowed
            if ($validated['max_images_allowed'] != $referenceType->max_images_allowed) {
                $diff = $validated['max_images_allowed'] - $referenceType->max_images_allowed;
                $remaining = ProductAILabReferenceType::getRemainingImages($referenceType->id);

                if ($diff > 0 && $diff > $remaining) {
                    return response()->json([
                        'message' => "Cannot increase images. Only $remaining slots remaining",
                        'errors' => ['max_images_allowed' => ["Only $remaining slots remaining"]],
                    ], 422);
                }
            }

            // Update reference type
            $referenceType->update([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'],
                'prompt_template' => $validated['prompt_template'],
                'max_images_allowed' => $validated['max_images_allowed'],
                'is_enabled' => $validated['is_enabled'] ?? true,
                'updated_by' => $admin->email,
            ]);

            Log::channel('admin')->info('Product AI Lab reference type updated', [
                'reference_type_id' => $referenceType->id,
                'admin' => $admin->email,
            ]);

            // Track changes for email
            $changes = [];
            foreach (['name', 'slug', 'description', 'prompt_template', 'max_images_allowed', 'is_enabled'] as $field) {
                if (isset($oldValues[$field]) && $oldValues[$field] !== $referenceType->$field) {
                    $changes[$field] = [
                        'old' => $oldValues[$field],
                        'new' => $referenceType->$field,
                    ];
                }
            }

            // Send notification email if changes
            if (!empty($changes)) {
                SendProductAILabSettingsSecurityEmailJob::dispatch(
                    $admin,
                    ['reference_type_updated' => $changes],
                    isReferenceTypeChange: true
                );
            }

            return response()->json([
                'message' => 'Reference type updated successfully',
                'reference_type' => $referenceType,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Reference type not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Failed to update product AI lab reference type', [
                'reference_type_id' => $id,
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to update reference type',
            ], 500);
        }
    }

    /**
     * Delete a reference type
     */
    public function destroy(Request $request, $id)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $referenceType = ProductAILabReferenceType::findOrFail($id);
            $deleted = $referenceType->toArray();

            $referenceType->delete();

            Log::channel('admin')->info('Product AI Lab reference type deleted', [
                'reference_type_id' => $id,
                'slug' => $referenceType->slug,
                'admin' => $admin->email,
            ]);

            // Send notification email
            SendProductAILabSettingsSecurityEmailJob::dispatch(
                $admin,
                ['reference_type_deleted' => $deleted],
                isReferenceTypeChange: true
            );

            return response()->json([
                'message' => 'Reference type deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Reference type not found',
            ], 404);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Failed to delete product AI lab reference type', [
                'reference_type_id' => $id,
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to delete reference type',
            ], 500);
        }
    }

    /**
     * Reorder reference types
     */
    public function reorder(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'order' => 'required|array',
                'order.*' => 'required|integer|exists:product_ai_lab_reference_types,id',
            ]);

            // Update order positions
            foreach ($validated['order'] as $position => $id) {
                ProductAILabReferenceType::where('id', $id)->update(['order_position' => $position]);
            }

            Log::channel('admin')->info('Product AI Lab reference types reordered', [
                'admin' => $admin->email,
            ]);

            return response()->json([
                'message' => 'Reference types reordered successfully',
                'reference_types' => ProductAILabReferenceType::ordered()->get(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Failed to reorder product AI lab reference types', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reorder reference types',
            ], 500);
        }
    }
}
