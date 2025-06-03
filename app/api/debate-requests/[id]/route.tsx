import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailService } from "@/services/email/email.service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requestId = params.id

        // Get the authenticated user
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get the debate request
        const debateRequest = await db.debateRequest.findUnique({
            where: { id: requestId },
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
                recipient: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        level: true,
                        rank: true,
                    },
                },
            },
        })

        if (!debateRequest) {
            return NextResponse.json({ error: "Debate request not found" }, { status: 404 })
        }

        // Check if the user is the sender or recipient
        if (debateRequest.sender_id !== user.id && debateRequest.recipient_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        return NextResponse.json(debateRequest)
    } catch (error) {
        console.error("Error fetching debate request:", error)
        return NextResponse.json({ error: "Failed to fetch debate request" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requestId = params.id

        // Get the authenticated user
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse the request body
        const body = await request.json()
        const { action } = body

        if (action !== "accept" && action !== "decline") {
            return NextResponse.json({ error: "Invalid action. Must be 'accept' or 'decline'" }, { status: 400 })
        }

        // Get the debate request
        const debateRequest = await db.debateRequest.findUnique({
            where: { id: requestId },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        })

        if (!debateRequest) {
            return NextResponse.json({ error: "Debate request not found" }, { status: 404 })
        }

        // Check if the user is the recipient
        if (debateRequest.recipient_id !== user.id) {
            return NextResponse.json({ error: "Only the recipient can accept or decline the request" }, { status: 403 })
        }

        // Check if the request is still pending
        if (debateRequest.status !== "PENDING") {
            return NextResponse.json({ error: "This request has already been processed" }, { status: 400 })
        }

        if (action === "accept") {
            // Update the request status
            await db.debateRequest.update({
                where: { id: requestId },
                data: { status: "ACCEPTED" },
            })

            // Create a new debate
            const debate = await db.debate.create({
                data: {
                    title: `Debate on ${debateRequest.topic}`,
                    topic: debateRequest.topic,
                    mode: debateRequest.mode,
                    status: "PENDING",
                    duration_minutes: debateRequest.duration_minutes,
                    creator_id: debateRequest.sender_id,
                    participants: {
                        create: [
                            {
                                user_id: debateRequest.sender_id,
                                role: "AFFIRMATIVE",
                                position: debateRequest.position,
                                is_ready: false,
                            },
                            {
                                user_id: debateRequest.recipient_id,
                                role: "NEGATIVE",
                                position: debateRequest.position === "FOR" ? "AGAINST" : "FOR",
                                is_ready: false,
                            },
                        ],
                    },
                },
            })

            // Send email notification to the sender
            try {
                await emailService.sendDebateRequestAcceptedEmail({
                    to: debateRequest.sender.email,
                    recipientName: debateRequest.sender.username,
                    senderName: debateRequest.recipient.username,
                    topic: debateRequest.topic,
                    debateId: debate.id,
                })
            } catch (emailError) {
                console.error("Failed to send debate request accepted email:", emailError)
                // Continue even if email fails
            }

            return NextResponse.json({
                message: "Debate request accepted",
                debate_id: debate.id,
            })
        } else {
            // Update the request status
            await db.debateRequest.update({
                where: { id: requestId },
                data: { status: "DECLINED" },
            })

            // Send email notification to the sender
            try {
                await emailService.sendDebateRequestDeclinedEmail({
                    to: debateRequest.sender.email,
                    recipientName: debateRequest.sender.username,
                    senderName: debateRequest.recipient.username,
                    topic: debateRequest.topic,
                })
            } catch (emailError) {
                console.error("Failed to send debate request declined email:", emailError)
                // Continue even if email fails
            }

            return NextResponse.json({
                message: "Debate request declined",
            })
        }
    } catch (error) {
        console.error("Error processing debate request:", error)
        return NextResponse.json({ error: "Failed to process debate request" }, { status: 500 })
    }
}
