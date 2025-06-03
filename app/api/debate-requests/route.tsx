import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailService } from "@/services/email/email.service"

export async function GET(request: NextRequest) {
    try {
        // Get the authenticated user
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get debate requests for the user
        const debateRequests = await db.debateRequest.findMany({
            where: {
                recipient_id: user.id,
                status: "PENDING",
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        level: true,
                        rank: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
        })

        return NextResponse.json(debateRequests)
    } catch (error) {
        console.error("Error fetching debate requests:", error)
        return NextResponse.json({ error: "Failed to fetch debate requests" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the authenticated user
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse the request body
        const body = await request.json()
        const { recipient_id, topic, position, mode, duration_minutes } = body

        // Validate the recipient
        const recipient = await db.user.findUnique({
            where: { id: recipient_id },
            select: { id: true, username: true, email: true },
        })

        if (!recipient) {
            return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
        }

        // Check if there's already a pending request
        const existingRequest = await db.debateRequest.findFirst({
            where: {
                sender_id: user.id,
                recipient_id,
                status: "PENDING",
            },
        })

        if (existingRequest) {
            return NextResponse.json({ error: "You already have a pending request to this user" }, { status: 400 })
        }

        // Create the debate request
        const debateRequest = await db.debateRequest.create({
            data: {
                sender_id: user.id,
                recipient_id,
                topic,
                position,
                mode: mode || "TEXT",
                duration_minutes: duration_minutes || 15,
                status: "PENDING",
            },
            include: {
                sender: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        })

        // Send email notification to the recipient
        try {
            await emailService.sendDebateRequestEmail({
                to: recipient.email,
                recipientName: recipient.username,
                senderName: user.username,
                topic,
                requestId: debateRequest.id,
            })
        } catch (emailError) {
            console.error("Failed to send debate request email:", emailError)
            // Continue even if email fails
        }

        return NextResponse.json({
            message: "Debate request sent successfully",
            request: debateRequest,
        })
    } catch (error) {
        console.error("Error creating debate request:", error)
        return NextResponse.json({ error: "Failed to create debate request" }, { status: 500 })
    }
}
